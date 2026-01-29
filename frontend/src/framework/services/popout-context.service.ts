import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import {
  PopOutMessage,
  PopOutMessageType,
  PopOutContext,
  parsePopOutRoute
} from '../models/popout.interface';

@Injectable({
  providedIn: 'root'
})
export class PopOutContextService implements OnDestroy {
  private channel: BroadcastChannel | null = null;
  private messagesSubject = new ReplaySubject<PopOutMessage>(10);
  private context: PopOutContext | null = null;
  private initialized = false;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    this.context = parsePopOutRoute(this.router.url);
  }

  isInPopOut(): boolean {
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context?.isPopOut || false;
  }

  getContext(): PopOutContext | null {
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context;
  }

  initializeAsPopOut(panelId: string): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.setupChannel(panelId);

    this.sendMessage({
      type: PopOutMessageType.PANEL_READY,
      timestamp: Date.now()
    });
  }

  initializeAsParent(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
  }

  private setupChannel(panelId: string): void {
    const channelName = `panel-${panelId}`;

    if (this.channel) {
      this.channel.close();
    }

    this.channel = new BroadcastChannel(channelName);

    this.channel.onmessage = (event: MessageEvent) => {
      const message = event.data as PopOutMessage;
      this.ngZone.run(() => {
        this.messagesSubject.next(message);
      });
    };

    this.channel.onmessageerror = () => {};
  }

  sendMessage<T = any>(message: PopOutMessage<T>): void {
    if (!this.channel) {
      return;
    }

    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    try {
      this.channel.postMessage(message);
    } catch (error) {}
  }

  getMessages$(): Observable<PopOutMessage> {
    return this.messagesSubject.asObservable();
  }

  createChannelForPanel(panelId: string): BroadcastChannel {
    const channelName = `panel-${panelId}`;
    const channel = new BroadcastChannel(channelName);
    return channel;
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.initialized = false;
  }

  ngOnDestroy(): void {
    this.close();
    this.messagesSubject.complete();
  }
}
