import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { TieredMenu } from 'primeng/tieredmenu';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { DomainConfigRegistry } from '../framework/services';
import { DOMAIN_PROVIDERS } from '../domain-config/domain-providers';
import packageJson from '../../package.json';

/**
 * Root Application Component (AppComponent)
 *
 * Main container component for the Generic-Prime application. Provides the global
 * application shell including the primary navigation menu and router outlet for
 * feature components.
 *
 * Responsibilities:
 * - Renders the application shell with PrimeNG TieredMenu navigation
 * - Registers all domain configuration providers during initialization
 * - Manages domain-specific navigation across 2 domains
 *
 * Navigation Structure:
 * - Automobiles: Home and Discovery interface for vehicle data
 * - Agriculture: Domain entry point for agricultural data (stub)
 *
 * Domain Integration:
 * Initializes DomainConfigRegistry with all available domain providers, enabling
 * dynamic domain selection and configuration loading. The registry is populated
 * once at app startup via the injected providers.
 *
 * @class AppComponent
 * @selector app-root
 * @remarks
 * This component uses PrimeNG's TieredMenu for nested navigation with flyout submenus.
 * Each domain has Home and Discover options.
 *
 * @see DomainConfigRegistry - Service managing domain configurations
 * @see MenuItem - PrimeNG menu item structure
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, TieredMenuModule, ToastModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ViewChild('menu') menu!: TieredMenu;

  title = 'generic-prime';
  version = packageJson.version;
  isPopOut = false;

  domainMenuItems: MenuItem[] = [
    {
      label: 'Automobiles',
      icon: '🚗',
      items: [
        { label: 'Autos Home', icon: '🏠', routerLink: ['/automobiles'] },
        { label: 'Autos Discover', icon: '🔍', routerLink: ['/automobiles/discover'] }
      ]
    },
    {
      label: 'Agriculture',
      icon: '🌾',
      items: [
        { label: 'Agriculture Home', icon: '🏠', routerLink: ['/agriculture'] },
        { label: 'Agriculture Discover', icon: '🔍', routerLink: ['/agriculture/discover'] }
      ]
    }
  ];

  constructor(
    private readonly domainConfigRegistry: DomainConfigRegistry,
    private readonly injector: Injector,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.domainConfigRegistry.registerDomainProviders(DOMAIN_PROVIDERS, this.injector);

    // Check if current URL is a popout route
    this.isPopOut = this.router.url.startsWith('/popout');

    // Also listen for navigation changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.isPopOut = event.urlAfterRedirects.startsWith('/popout');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle the domains menu popup
   */
  toggleMenu(event: Event): void {
    this.menu.toggle(event);
  }

}

