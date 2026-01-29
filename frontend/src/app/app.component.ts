import { Component, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DomainConfigRegistry } from '../framework/services';
import { DOMAIN_PROVIDERS } from '../domain-config/domain-providers';
import { AiChatComponent } from '../framework/components/ai-chat/ai-chat.component';
import { AiService, createAutomobileApiContext } from '../framework/services/ai.service';
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
    imports: [RouterOutlet, RouterLink, TieredMenuModule, ToastModule, TooltipModule, ButtonModule, AiChatComponent],
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
   * Whether the AI chat panel is visible
   * @type {Signal<boolean>}
   */
  aiChatVisible = signal(false);

  /**
   * Currently active domain based on URL path
   * Used to determine if API context should be enabled for AI chat
   * @type {Signal<string | null>}
   */
  activeDomain = signal<string | null>(null);

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
  private readonly router = inject(Router);
  private readonly aiService = inject(AiService);

  constructor() {
    this.domainConfigRegistry.registerDomainProviders(DOMAIN_PROVIDERS, this.injector);

    // Detect if this is a pop-out window by checking for ?popout query parameter
    // Pop-out windows hide the header and show only the router-outlet with panel content
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.isPopOut = !!params['popout'];
    });

    // Track active domain from URL path for AI context
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(event => {
      this.updateActiveDomain(event.urlAfterRedirects);
    });

    // Set initial domain from current URL
    this.updateActiveDomain(this.router.url);
  }

  /**
   * Update the active domain based on URL path
   * Also configures AI context based on domain
   *
   * @param url - Current URL path
   */
  private updateActiveDomain(url: string): void {
    const path = url.split('?')[0]; // Remove query params
    const segments = path.split('/').filter(s => s);
    const domain = segments[0] || null;

    this.activeDomain.set(domain);

    // Configure AI context based on domain
    // Only Automobiles domain gets API-aware context for query generation
    if (domain === 'automobiles') {
      this.aiService.setApiContext(createAutomobileApiContext());
    } else {
      this.aiService.clearApiContext();
    }
  }

  /**
   * Toggle AI chat panel visibility
   */
  toggleAiChat(): void {
    this.aiChatVisible.update(v => !v);
  }

  /**
   * Close AI chat panel
   */
  onAiChatClose(): void {
    this.aiChatVisible.set(false);
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

