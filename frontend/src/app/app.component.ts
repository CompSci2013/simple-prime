import { Component, inject, Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';
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
 * - Manages domain-specific navigation across 5 domains
 * - Provides access to developer tools (dependency graph, test reports)
 *
 * Navigation Structure:
 * - Automobiles: Home and Discovery interface for vehicle data
 * - Agriculture: Domain entry point for agricultural data (stub)
 * - Physics: Concept graphs, syllabus, classical mechanics visualization
 * - Chemistry: Domain entry point for chemistry data (stub)
 * - Mathematics: Domain entry point for math data (stub)
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
    imports: [RouterOutlet, RouterLink, TieredMenuModule, ToastModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /**
   * Application title identifier
   * @type {string}
   */
  title = 'generic-prime';

  /**
   * Application version from package.json
   * @type {string}
   */
  version = packageJson.version;

  /**
   * Whether this window is a pop-out (detected from ?popout=panelId query param)
   * When true, the header is hidden and only the router-outlet is shown
   * @type {boolean}
   */
  isPopOut = false;

  /**
   * Domain navigation menu items with TieredMenu structure (nested items with flyout submenus)
   *
   * Organized hierarchically:
   * - Top level: Domain category (Automobiles, Physics, etc.)
   * - Sub-level: Domain-specific actions (Home, Discover, View Reports)
   * - Actions: Navigation (routerLink) or command execution (command function)
   *
   * @type {MenuItem[]}
   */
  domainMenuItems: MenuItem[] = [
    {
      label: 'Automobiles',
      icon: '🚗',
      items: [
        { label: 'Autos Home', icon: '🏠', routerLink: '/automobiles' },
        { label: 'Autos Discover', icon: '🔍', routerLink: '/automobiles/discover' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Agriculture',
      icon: '🌾',
      items: [
        { label: 'Agriculture Home', icon: '🏠', routerLink: '/agriculture' },
        { label: 'Agriculture Discover', icon: '🔍', routerLink: '/agriculture/discover' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Physics',
      icon: '⚛️',
      items: [
        { label: 'Physics Home', icon: '🏠', routerLink: '/physics' },
        { label: 'Physics Discover', icon: '🔍', routerLink: '/physics/discover' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Chemistry',
      icon: '🧪',
      items: [
        { label: 'Chemistry Home', icon: '🏠', routerLink: '/chemistry' },
        { label: 'Chemistry Discover', icon: '🔍', routerLink: '/chemistry/discover' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Mathematics',
      icon: '📐',
      items: [
        { label: 'Math Home', icon: '🏠', routerLink: '/math' },
        { label: 'Math Discover', icon: '🔍', routerLink: '/math/discover' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    },
    {
      label: 'Developer',
      icon: '⚙️',
      items: [
        { label: 'Dependency Graph', icon: '🔗', routerLink: '/dependencies' },
        { label: 'View Test Reports', icon: '📋', command: () => this.openTestReports() }
      ]
    }
  ];

  // ============================================================================
  // Dependency Injection (Angular 17+ inject() pattern)
  // ============================================================================
  private readonly domainConfigRegistry = inject(DomainConfigRegistry);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.domainConfigRegistry.registerDomainProviders(DOMAIN_PROVIDERS, this.injector);

    // Detect if this is a pop-out window by checking for ?popout query parameter
    // Pop-out windows hide the header and show only the router-outlet with panel content
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.isPopOut = !!params['popout'];
    });
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

