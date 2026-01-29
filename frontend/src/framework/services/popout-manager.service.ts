import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  buildWindowFeatures,
  PopOutMessage,
  PopOutMessageType,
  PopOutWindowFeatures,
  PopOutWindowRef
} from '../models/popout.interface';
import { PopOutContextService } from './popout-context.service';

/**
 * Pop-Out Manager Service
 *
 * Manages the lifecycle of pop-out windows from the main window perspective.
 * Extracted from DiscoverComponent to provide reusable pop-out infrastructure.
 *
 * **Responsibilities**:
 * - Open pop-out windows with proper BroadcastChannel setup
 * - Monitor for window close events
 * - Broadcast state to all open pop-outs
 * - Clean up on main window close
 * - Expose observables for messages and close events
 *
 * **Usage**:
 * ```typescript
 * constructor(private popOutManager: PopOutManagerService) {}
 *
 * ngOnInit() {
 *   this.popOutManager.initialize('discover');
 *
 *   // Handle messages from pop-outs
 *   this.popOutManager.messages$.subscribe(msg => {
 *     // Route to URL updates
 *   });
 *
 *   // Handle pop-out closed
 *   this.popOutManager.closed$.subscribe(panelId => {
 *     this.cdr.markForCheck();
 *   });
 *
 *   // Broadcast state when it changes
 *   this.resourceService.state$.subscribe(state => {
 *     this.popOutManager.broadcastState(state);
 *   });
 * }
 *
 * popOut(panelId: string, panelType: string) {
 *   this.popOutManager.openPopOut(panelId, panelType);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PopOutManagerService implements OnDestroy {
  /**
   * Grid identifier for routing (e.g., 'discover')
   */
  private gridId = '';

  /**
   * Set of panel IDs that are currently popped out
   */
  private poppedOutPanels = new Set<string>();

  /**
   * Map of pop-out windows and their associated channels
   */
  private popoutWindows = new Map<string, PopOutWindowRef>();

  /**
   * Subject for messages received from pop-outs
   */
  private messagesSubject = new Subject<{ panelId: string; message: PopOutMessage }>();

  /**
   * Subject for pop-out close events
   */
  private closedSubject = new Subject<string>();

  /**
   * Subject for pop-up blocked events
   */
  private blockedSubject = new Subject<string>();

  /**
   * Bound beforeunload handler
   */
  private beforeUnloadHandler = () => this.closeAllPopOuts();

  /**
   * Whether the service has been initialized
   */
  private initialized = false;

  /**
   * Observable of messages from pop-out windows
   */
  readonly messages$ = this.messagesSubject.asObservable();

  /**
   * Observable of pop-out close events (emits panelId)
   */
  readonly closed$ = this.closedSubject.asObservable();

  /**
   * Observable of pop-up blocked events (emits panelId)
   */
  readonly blocked$ = this.blockedSubject.asObservable();

  constructor(
    private popOutContext: PopOutContextService,
    private ngZone: NgZone
  ) {}

  /**
   * Initialize the pop-out manager
   *
   * @param gridId - Grid identifier for routing (e.g., 'discover')
   */
  initialize(gridId: string): void {
    if (this.initialized) {
      return;
    }

    this.gridId = gridId;
    this.initialized = true;

    // Initialize PopOutContextService as parent window
    this.popOutContext.initializeAsParent();

    // Close all pop-outs when main window refreshes/closes
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Listen for messages via PopOutContextService
    this.popOutContext.getMessages$().subscribe(message => {
      this.messagesSubject.next({ panelId: '', message });
    });
  }

  /**
   * Check if a panel is currently popped out
   *
   * @param panelId - Panel identifier
   * @returns True if panel is popped out
   */
  isPoppedOut(panelId: string): boolean {
    return this.poppedOutPanels.has(panelId);
  }

  /**
   * Get all currently popped out panel IDs
   */
  getPoppedOutPanels(): string[] {
    return Array.from(this.poppedOutPanels);
  }

  /**
   * Open a panel in a pop-out window
   *
   * @param panelId - Panel identifier
   * @param panelType - Panel type for routing
   * @param features - Optional window features
   * @returns True if window opened successfully
   */
  openPopOut(
    panelId: string,
    panelType: string,
    features?: Partial<PopOutWindowFeatures>
  ): boolean {
    // Check if already popped out
    if (this.poppedOutPanels.has(panelId)) {
      return false;
    }

    // Build pop-out URL
    const url = `/panel/${this.gridId}/${panelId}/${panelType}?popout=${panelId}`;

    // Window features with defaults
    const windowFeatures = buildWindowFeatures({
      width: 1200,
      height: 800,
      left: 100,
      top: 100,
      resizable: true,
      scrollbars: true,
      ...features
    });

    // Open window
    const popoutWindow = window.open(url, `panel-${panelId}`, windowFeatures);

    if (!popoutWindow) {
      // Pop-up blocked
      this.blockedSubject.next(panelId);
      return false;
    }

    // Track as popped out
    this.poppedOutPanels.add(panelId);

    // Set up BroadcastChannel
    const channel = this.popOutContext.createChannelForPanel(panelId);

    // Listen for messages (zone-aware)
    channel.onmessage = event => {
      this.ngZone.run(() => {
        this.messagesSubject.next({ panelId, message: event.data });
      });
    };

    // Monitor for window close
    const checkInterval = window.setInterval(() => {
      if (popoutWindow.closed) {
        this.ngZone.run(() => {
          this.handlePopOutClosed(panelId, channel, checkInterval);
        });
      }
    }, 500);

    // Store reference
    this.popoutWindows.set(panelId, {
      window: popoutWindow,
      channel,
      checkInterval,
      panelId,
      panelType
    });

    return true;
  }

  /**
   * Broadcast state to all pop-out windows
   *
   * @param state - State to broadcast
   */
  broadcastState(state: any): void {
    if (this.popoutWindows.size === 0) {
      return;
    }

    const message = {
      type: PopOutMessageType.STATE_UPDATE,
      payload: { state },
      timestamp: Date.now()
    };

    this.popoutWindows.forEach(({ channel }) => {
      try {
        channel.postMessage(message);
      } catch {
        // Silently ignore posting errors
      }
    });
  }

  /**
   * Close a specific pop-out window
   *
   * @param panelId - Panel identifier
   */
  closePopOut(panelId: string): void {
    const ref = this.popoutWindows.get(panelId);
    if (ref) {
      ref.channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Close all pop-out windows
   */
  closeAllPopOuts(): void {
    this.popoutWindows.forEach(({ channel }) => {
      channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle pop-out window closure
   */
  private handlePopOutClosed(
    panelId: string,
    channel: BroadcastChannel,
    checkInterval: number
  ): void {
    clearInterval(checkInterval);
    channel.close();
    this.popoutWindows.delete(panelId);
    this.poppedOutPanels.delete(panelId);

    this.closedSubject.next(panelId);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);

    // Clean up all pop-out windows
    this.popoutWindows.forEach(({ window: win, channel, checkInterval }) => {
      clearInterval(checkInterval);
      channel.close();
      if (win && !win.closed) {
        win.close();
      }
    });

    this.messagesSubject.complete();
    this.closedSubject.complete();
    this.blockedSubject.complete();
  }
}
