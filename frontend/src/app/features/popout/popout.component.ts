/**
 * Popout Component
 *
 * A minimal layout component for popout windows. This component:
 * 1. Provides ResourceManagementService and IS_POPOUT_TOKEN to children
 * 2. Sets the active domain so child components can inject it
 * 3. Syncs state from main window via BroadcastChannel
 * 4. Renders child components via router-outlet
 *
 * The popout has NO knowledge of specific component types. Child routes
 * determine which component is rendered. Each child component is responsible
 * for its own behavior - it injects the services it needs.
 *
 * URL structure: /popout/:gridId/:componentId/:type
 * The :type segment maps to child routes (query-control, picker, chart, etc.)
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  PopOutMessage,
  PopOutMessageType
} from '../../../framework/models/popout.interface';
import { DomainConfigRegistry } from '../../../framework/services/domain-config-registry.service';
import { PopOutContextService } from '../../../framework/services/popout-context.service';
import { ResourceManagementService } from '../../../framework/services/resource-management.service';
import { IS_POPOUT_TOKEN } from '../../../framework/tokens/popout.token';

@Component({
  selector: 'app-popout',
  standalone: true,
  template: `
    <div class="popout-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./popout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ResourceManagementService,
    { provide: IS_POPOUT_TOKEN, useValue: true }
  ],
  imports: [CommonModule, RouterOutlet]
})
export class PopoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private popOutContext: PopOutContextService,
    private cdr: ChangeDetectorRef,
    private resourceService: ResourceManagementService<any, any, any>,
    private domainRegistry: DomainConfigRegistry
  ) {}

  ngOnInit(): void {
    // Extract route params and initialize
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const gridId = params['gridId'];
      const componentId = params['componentId'];

      // Extract domain from gridId (e.g., 'automobile-discover' -> 'automobile')
      const domainName = gridId.split('-')[0] || 'automobile';

      // Set active domain so child components can use domainRegistry.getActive()
      this.domainRegistry.setActive(domainName);

      // Initialize popout context for BroadcastChannel communication
      this.popOutContext.initializeAsPopOut(componentId);

      // Add popout styling
      document.documentElement.classList.add('popout-html');
      document.body.classList.add('popout-body');
    });

    // Handle messages from main window
    this.popOutContext
      .getMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleMessage(message);
      });
  }

  private handleMessage(message: PopOutMessage): void {
    switch (message.type) {
      case PopOutMessageType.CLOSE_POPOUT:
        window.close();
        break;

      case PopOutMessageType.STATE_UPDATE:
        if (message.payload?.state) {
          this.resourceService.syncStateFromExternal(message.payload.state);
          this.cdr.detectChanges();
        }
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
