# Modules

## Modules in workspace

| Module | Declarations | Imports | Exports | Bootstrap | Providers | Entry points |
| ---| --- | --- | --- | --- | --- | --- |
| AppRoutingModule | 0 | 1 | 1 | 0 | 0 | 0 |
| AppModule | 4 | 8 | 0 | 1 | 3 | 0 |
| FrameworkModule | 0 | 2 | 0 | 0 | 0 | 0 |
| DatePipeComponent | 0 | 0 | 0 | 0 | 1 | 0 |
| NgZoneDemo | 0 | 0 | 0 | 0 | 1 | 0 |
| HeroComponent | 0 | 1 | 0 | 0 | 3 | 0 |
| AppModule | 0 | 2 | 0 | 0 | 1 | 0 |
| PickerConfigRegistry | 0 | 0 | 0 | 0 | 0 | 0 |
| PrimengModule | 0 | 2 | 1 | 0 | 0 | 0 |

## AppRoutingModule

Filename: /home/odin/projects/generic-prime/frontend/src/app/app-routing.module.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports | RouterModule.forRoot(routes) |
| Exports | RouterModule |
| Bootstrap |  |
| Providers |  |
| Entry components |  |

## AppModule

Filename: /home/odin/projects/generic-prime/frontend/src/app/app.module.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations | AppComponent,<br>DiscoverComponent,<br>PanelPopoutComponent,<br>ReportComponent |
| Imports | AppRoutingModule,<br>BrowserAnimationsModule,<br>BrowserModule,<br>DragDropModule,<br>FormsModule,<br>FrameworkModule,<br>HttpClientModule,<br>PrimengModule |
| Exports |  |
| Bootstrap | AppComponent |
| Providers | MessageService,<br>{provide: DOMAIN_CONFIGuseFactory: createAutomobileDomainConfigdeps: [Injector]},<br>{provide: ErrorHandleruseClass: GlobalErrorHandler} |
| Entry components |  |

## FrameworkModule

Filename: /home/odin/projects/generic-prime/frontend/src/framework/framework.module.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports | *     CommonModule,<br>*     FrameworkModule* |
| Exports |  |
| Bootstrap |  |
| Providers |  |
| Entry components |  |

## DatePipeComponent

Filename: /home/odin/projects/generic-prime/frontend/node_modules/@angular/common/index.d.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports |  |
| Exports |  |
| Bootstrap |  |
| Providers | {provide: APP_BASE_HREF useValue: '/my/app'} |
| Entry components |  |

## NgZoneDemo

Filename: /home/odin/projects/generic-prime/frontend/node_modules/@angular/core/index.d.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports |  |
| Exports |  |
| Bootstrap |  |
| Providers | provideRoutes(routes) |
| Entry components |  |

## HeroComponent

Filename: /home/odin/projects/generic-prime/frontend/node_modules/@angular/router/index.d.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports | *     RouterModule.forRoot([*       {*         path: 'team/:id'*         component: TeamComponent*         canActivate: [CanActivateTeam]*       }*     ])* |
| Exports |  |
| Bootstrap |  |
| Providers | CanActivateTeam,<br>Permissions,<br>UserToken |
| Entry components |  |

## AppModule

Filename: /home/odin/projects/generic-prime/frontend/node_modules/@angular/router/upgrade/index.d.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports | *   RouterModule.forRoot(SOME_ROUTES),<br>*   UpgradeModule* |
| Exports |  |
| Bootstrap |  |
| Providers | *   RouterUpgradeInitializer* |
| Entry components |  |

## PickerConfigRegistry

Filename: /home/odin/projects/generic-prime/frontend/src/framework/services/picker-config-registry.service.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports |  |
| Exports |  |
| Bootstrap |  |
| Providers |  |
| Entry components |  |

## PrimengModule

Filename: /home/odin/projects/generic-prime/frontend/src/app/primeng.module.ts

| Section | Classes, service, modules |
| ---- |:-----------|
| Declarations |  |
| Imports | ...PRIMENG_MODULES,<br>CommonModule |
| Exports | ...PRIMENG_MODULES |
| Bootstrap |  |
| Providers |  |
| Entry components |  |

