import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';
import { TieredMenu } from 'primeng/tieredmenu';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
 * - Provides access to developer tools (dependency graph, test reports)
 *
 * Navigation Structure:
 * - Automobiles: Home and Discovery interface for vehicle data
 * - Agriculture: Domain entry point for agricultural data (stub)
 * - Developer: Tools for architecture analysis (dependency graph, reports)
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
 * Each domain has Home, Discover, and Reports options where applicable.
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
        { label: 'Autos Discover', icon: '🔍', routerLink: ['/automobiles/discover'] },
        { label: 'Autos Discover 2', icon: '🔍', routerLink: ['/automobiles/discover2'] },
        { label: 'Autos Discover 3', icon: '🔍', routerLink: ['/automobiles/discover3'] },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Agriculture',
      icon: '🌾',
      items: [
        { label: 'Agriculture Home', icon: '🏠', routerLink: ['/agriculture'] },
        { label: 'Agriculture Discover', icon: '🔍', routerLink: ['/agriculture/discover'] },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Developer',
      icon: '⚙️',
      items: [
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    }
  ];

  constructor(
    private readonly domainConfigRegistry: DomainConfigRegistry,
    private readonly injector: Injector,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.domainConfigRegistry.registerDomainProviders(DOMAIN_PROVIDERS, this.injector);

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.isPopOut = !!params['popout'];
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

  /**
   * Opens Playwright test reports in a new browser tab
   *
   * Navigates to the '/report' route and displays it in a new window.
   * Called from the "View Test Reports" menu items across all domains.
   *
   * @public
   * @returns {void}
   */
  openTestReports(): void {
    window.open('/report', '_blank');
  }
}

