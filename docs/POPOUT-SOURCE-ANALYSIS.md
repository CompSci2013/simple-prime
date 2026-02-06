# Popout Implementation: Source Code Analysis

Direct analysis of `golden-layout@2.6.0` and `dockview-core@4.13.0` from node_modules.

---

## Golden Layout

### File: `src/ts/controls/browser-popout.ts`

**Core mechanism**: Opens the SAME URL with config passed via localStorage key.

```typescript
// Creates URL with localStorage key as GET parameter
private createUrl(): string {
    const storageKey = 'gl-window-config-' + getUniqueId();
    const config = ResolvedLayoutConfig.minifyConfig(this._config);

    try {
        localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (e) {
        throw new Error('Error while writing to localStorage ' + getErrorMessage(e));
    }

    const url = new URL(location.href);
    url.searchParams.set('gl-window', storageKey);
    return url.toString();
}
```

**Window creation**:
```typescript
private createWindow(): void {
    const url = this.createUrl();
    const target = Math.floor(Math.random() * 1000000).toString(36);  // Random name

    const features = this.serializeWindowFeatures({
        width: this._initialWindowSize.width,
        height: this._initialWindowSize.height,
        menubar: 'no',
        toolbar: 'no',
        location: 'no',
        personalbar: 'no',
        resizable: 'yes',
        scrollbars: 'no',
        status: 'no'
    });

    this._popoutWindow = globalThis.open(url, target, features);

    // Poll for child window initialization
    this._checkReadyInterval = setInterval(() => this.checkReady(), 10);
}
```

**Initialization detection** (polling the child window):
```typescript
private checkReady() {
    if (this._popoutWindow.__glInstance && this._popoutWindow.__glInstance.isInitialised) {
        this.onInitialised();
        clearInterval(this._checkReadyInterval);
    }
}
```

### File: `src/ts/virtual-layout.ts`

**Child window detection** (reads config from localStorage):
```typescript
const windowConfigKey = new URL(document.location.href).searchParams.get('gl-window');
const isSubWindow = windowConfigKey !== null;

if (windowConfigKey !== null) {
    const windowConfigStr = localStorage.getItem(windowConfigKey);
    localStorage.removeItem(windowConfigKey);  // Clean up immediately
    const minifiedWindowConfig = JSON.parse(windowConfigStr);
    const resolvedConfig = ResolvedLayoutConfig.unminifyConfig(minifiedWindowConfig);
    config = LayoutConfig.fromResolved(resolvedConfig);
}
```

**Subwindow setup** (clears DOM, keeps styles):
```typescript
clearHtmlAndAdjustStylesForSubWindow(): void {
    const headElement = document.head;

    // Preserve these elements
    const appendNodeLists = [
        document.querySelectorAll('body link'),
        document.querySelectorAll('body style'),
        document.querySelectorAll('template'),
        document.querySelectorAll('.gl_keep')
    ];

    // Move preserved elements to head
    for (const nodeList of appendNodeLists) {
        for (const node of nodeList) {
            headElement.appendChild(node);
        }
    }

    // Clear body and rebuild
    document.body.innerHTML = '';
    document.body.style.visibility = 'visible';

    // Expose instance for parent communication
    window.__glInstance = this;
}
```

### File: `src/ts/utils/event-hub.ts`

**Cross-window communication** (CustomEvent on window.opener):
```typescript
class EventHub extends EventEmitter {
    // Only userBroadcast events cross windows
    emitUserBroadcast(...args: EventEmitter.UnknownParams): void {
        this.handleUserBroadcastEvent('userBroadcast', args);
    }

    private handleUserBroadcastEvent(eventName: string, args: unknown[]) {
        if (this._layoutManager.isSubWindow) {
            // Bubble up to parent
            this.propagateToParent(eventName, args);
        } else {
            // Root: propagate down to all children
            this.propagateToThisAndSubtree(eventName, args);
        }
    }

    // Send to parent via CustomEvent
    private propagateToParent(eventName: string, args: unknown[]) {
        const event = new CustomEvent('gl_child_event', {
            bubbles: true,
            cancelable: true,
            detail: { layoutManager: this._layoutManager, eventName, args }
        });
        globalThis.opener.dispatchEvent(event);
    }

    // Recurse through all child windows
    private propagateToThisAndSubtree(eventName: string, args: unknown[]) {
        this.emitUnknown(eventName, ...args);
        for (const popout of this._layoutManager.openPopouts) {
            const childGl = popout.getGlInstance();
            if (childGl) {
                childGl.eventHub.propagateToThisAndSubtree(eventName, args);
            }
        }
    }
}
```

### Golden Layout Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PARENT WINDOW                                                    │
│                                                                  │
│  1. User clicks popout button                                   │
│  2. Config serialized → localStorage                            │
│  3. window.open(sameUrl?gl-window=storageKey)                   │
│  4. Poll child: setInterval(() => child.__glInstance?, 10ms)    │
│  5. Listen for CustomEvents from children                       │
│                                                                  │
│  EventHub:                                                       │
│  - Receives 'gl_child_event' from children                      │
│  - Broadcasts to all children via direct reference              │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ window.open()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHILD WINDOW (same URL)                                          │
│                                                                  │
│  1. Detects ?gl-window=key in URL                               │
│  2. Reads config from localStorage, deletes key                 │
│  3. Clears DOM body (preserves styles/links/.gl_keep)           │
│  4. Initializes GoldenLayout with config                        │
│  5. Sets window.__glInstance = this                             │
│                                                                  │
│  EventHub:                                                       │
│  - Sends events to parent via: opener.dispatchEvent()           │
│  - Receives events via direct reference from parent             │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: No BroadcastChannel. Uses direct window references (`opener`, `__glInstance`) and CustomEvents.

---

## Dockview

### File: `popoutWindow.js`

**Core mechanism**: Opens a BLANK URL and injects content + styles.

```typescript
class PopoutWindow extends CompositeDisposable {
    open(): Promise<HTMLElement | null> {
        const url = this.options.url;  // e.g., '/popout.html'
        const features = Object.entries({
            top: this.options.top,
            left: this.options.left,
            width: this.options.width,
            height: this.options.height,
        }).map(([key, value]) => `${key}=${value}`).join(',');

        const externalWindow = window.open(url, this.target, features);

        if (!externalWindow) {
            return null;  // Popup blocked
        }

        return new Promise((resolve, reject) => {
            externalWindow.addEventListener('load', () => {
                const externalDocument = externalWindow.document;
                externalDocument.title = document.title;

                // Create container and inject into blank page
                const container = this.createPopoutWindowContainer();
                externalDocument.body.appendChild(container);

                // Copy ALL styles from parent window
                addStyles(externalDocument, window.document.styleSheets);

                resolve(container);
            });
        });
    }

    createPopoutWindowContainer(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('dv-popout-window');
        el.id = 'dv-popout-window';
        el.style.position = 'absolute';
        el.style.width = '100%';
        el.style.height = '100%';
        return el;
    }
}
```

### File: `dom.js` - Style copying

```typescript
function addStyles(document: Document, styleSheetList: StyleSheetList) {
    const styleSheets = Array.from(styleSheetList);

    for (const styleSheet of styleSheets) {
        // External stylesheets: create link element
        if (styleSheet.href) {
            const link = document.createElement('link');
            link.href = styleSheet.href;
            link.type = styleSheet.type;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Inline styles: extract cssRules and inject
        let cssTexts = [];
        try {
            if (styleSheet.cssRules) {
                cssTexts = Array.from(styleSheet.cssRules).map(rule => rule.cssText);
            }
        } catch (err) {
            // Security errors (CORS), ignore
        }

        for (const rule of cssTexts) {
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(rule));
            document.head.appendChild(style);
        }
    }
}
```

### File: `dockviewComponent.js` - Popout orchestration

**Adding a popout group**:
```typescript
addPopoutGroup(itemToPopout, options) {
    // Determine what to popout
    const referenceGroup = options?.referenceGroup
        ? options.referenceGroup
        : itemToPopout instanceof DockviewPanel
            ? itemToPopout.group
            : itemToPopout;

    // Create new PopoutWindow
    const _window = new PopoutWindow(
        `${this.id}-${groupId}`,
        'dv-dockview',
        {
            url: options?.popoutUrl ?? '/popout.html',
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            onDidOpen: options?.onDidOpen,
            onWillClose: options?.onWillClose,
        }
    );

    // Open window and inject group
    _window.open().then((popoutContainer) => {
        if (!popoutContainer) {
            // Popup blocked
            this._onDidOpenPopoutWindowFail.fire();
            return;
        }

        // Move panels from reference to popout group
        if (itemToPopout instanceof DockviewPanel) {
            const panel = referenceGroup.model.removePanel(itemToPopout);
            group.model.openPanel(panel);
        } else {
            moveGroupWithoutDestroying({ from: referenceGroup, to: group });
            referenceGroup.api.setVisible(false);  // Hide ghost group
        }

        // Inject into popout container
        popoutContainer.appendChild(group.element);

        // Track the popout
        this._popoutGroups.push({
            window: _window,
            popoutGroup: group,
            referenceGroup: referenceGroup.id,  // For restoration
            disposable: { ... }
        });
    });
}
```

**Restoration on close**:
```typescript
// When popout closes, restore to reference group
_window.onDidClose(() => {
    if (this.getPanel(referenceGroup.id)) {
        moveGroupWithoutDestroying({ from: group, to: referenceGroup });
        if (!referenceGroup.api.isVisible) {
            referenceGroup.api.setVisible(true);
        }
    }
});
```

**No cross-window messaging**: Dockview keeps panels in the parent's memory, just moves the DOM element to the popout window. All state changes happen in the parent's JavaScript context.

### Dockview Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PARENT WINDOW                                                    │
│                                                                  │
│  1. User clicks popout button                                   │
│  2. Create new group, move panels to it                         │
│  3. window.open('/popout.html')                                 │
│  4. Wait for load event                                         │
│  5. Inject styles (copy all styleSheets)                        │
│  6. Append group.element to popout container                    │
│                                                                  │
│  State Management:                                               │
│  - All panel/group objects stay in parent memory                │
│  - Only DOM moves to child window                               │
│  - No messaging needed - same JS context owns everything        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ window.open() + appendChild()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHILD WINDOW (/popout.html - blank page)                         │
│                                                                  │
│  HTML: Just a blank shell                                        │
│  <html><head></head><body></body></html>                        │
│                                                                  │
│  After parent injects:                                          │
│  - <style> elements copied from parent                          │
│  - <link> elements for external CSS                             │
│  - <div class="dv-popout-window">                               │
│      <div class="group">...actual panel DOM...</div>            │
│    </div>                                                        │
│                                                                  │
│  JavaScript: None. Parent owns all state.                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: The popout is just a DOM viewport. The parent window's JavaScript controls everything.

---

## SimplePrime (Our Implementation)

### File: `framework/services/popout-manager.service.ts`

**Core mechanism**: Opens Angular app at a specific route with component type in URL.

```typescript
openPopOut(panelId: string, panelType: string, features?: Partial<PopOutWindowFeatures>): boolean {
    // URL structure: /popout/:gridId/:componentId/:type
    const url = `/popout/${this.gridId}/${panelId}/${panelType}`;

    const windowFeatures = buildWindowFeatures({
        width: 1200, height: 800, left: 100, top: 100,
        resizable: true, scrollbars: true,
        ...features
    });

    const popoutWindow = window.open(url, `panel-${panelId}`, windowFeatures);

    if (!popoutWindow) {
        this.blockedSubject.next(panelId);
        return false;
    }

    // Create BroadcastChannel for this specific panel
    const channel = this.popOutContext.createChannelForPanel(panelId);

    channel.onmessage = event => {
        this.ngZone.run(() => {
            this.messagesSubject.next({ panelId, message: event.data });
        });
    };

    // Poll to detect window close
    const checkInterval = window.setInterval(() => {
        if (popoutWindow.closed) {
            this.handlePopOutClosed(panelId, channel, checkInterval);
        }
    }, 500);

    this.popoutWindows.set(panelId, { window: popoutWindow, channel, ... });
    return true;
}
```

### File: `features/popout/popout.component.ts`

**Child window initialization** (Angular route component):
```typescript
@Component({
    providers: [
        ResourceManagementService,
        { provide: IS_POPOUT_TOKEN, useValue: true }  // Context token
    ]
})
export class PopoutComponent implements OnInit {
    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const gridId = params['gridId'];
            const componentId = params['componentId'];

            // Extract domain and activate
            const domainName = gridId.split('-')[0];
            this.domainRegistry.setActive(domainName);

            // Initialize BroadcastChannel
            this.popOutContext.initializeAsPopOut(componentId);

            // Add popout styling
            document.documentElement.classList.add('popout-html');
            document.body.classList.add('popout-body');
        });

        // Handle messages from main window
        this.popOutContext.getMessages$().subscribe(message => {
            switch (message.type) {
                case PopOutMessageType.STATE_UPDATE:
                    this.resourceService.syncStateFromExternal(message.payload.state);
                    this.cdr.detectChanges();
                    break;
                case PopOutMessageType.CLOSE_POPOUT:
                    window.close();
                    break;
            }
        });
    }
}
```

### File: `framework/services/popout-context.service.ts`

**BroadcastChannel communication**:
```typescript
@Injectable({ providedIn: 'root' })
export class PopOutContextService {
    private channel: BroadcastChannel | null = null;

    isInPopOut(): boolean {
        return this.context?.isPopOut || false;
    }

    initializeAsPopOut(panelId: string): void {
        this.setupChannel(panelId);
        this.sendMessage({ type: PopOutMessageType.PANEL_READY });
    }

    private setupChannel(panelId: string): void {
        this.channel = new BroadcastChannel(`panel-${panelId}`);
        this.channel.onmessage = (event) => {
            this.ngZone.run(() => {
                this.messagesSubject.next(event.data);
            });
        };
    }

    sendMessage<T>(message: PopOutMessage<T>): void {
        this.channel?.postMessage(message);
    }
}
```

### Component Usage Pattern

Components check `isInPopOut()` to decide behavior:
```typescript
// query-control.component.ts
if (this.popOutContext.isInPopOut()) {
    // In pop-out: subscribe to STATE_UPDATE messages
    this.popOutContext.getMessages$().subscribe(msg => {
        if (msg.type === PopOutMessageType.STATE_UPDATE) {
            this.updateFromState(msg.payload.state);
        }
    });
}

// On user action in popout
if (this.popOutContext.isInPopOut()) {
    // Send message to parent instead of updating URL directly
    this.popOutContext.sendMessage({
        type: PopOutMessageType.URL_PARAMS_CHANGED,
        payload: { params: newParams }
    });
} else {
    // In main window: update URL directly
    this.urlStateService.navigate(newParams);
}
```

### SimplePrime Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PARENT WINDOW                                                    │
│                                                                  │
│  1. User clicks popout button                                   │
│  2. window.open('/popout/gridId/componentId/type')              │
│  3. Create BroadcastChannel('panel-componentId')                │
│  4. Poll for window.closed every 500ms                          │
│  5. Listen for messages from popout                             │
│  6. Broadcast state updates to all popouts                      │
│                                                                  │
│  PopOutManagerService:                                           │
│  - Tracks all open popout windows                               │
│  - broadcastState() sends to all channels                       │
│  - Closes all popouts on beforeunload                           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ window.open() + BroadcastChannel
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ CHILD WINDOW (full Angular app at /popout/...)                   │
│                                                                  │
│  1. Angular routes to PopoutComponent                           │
│  2. Extracts gridId, componentId, type from URL                 │
│  3. Sets active domain                                          │
│  4. Provides IS_POPOUT_TOKEN = true                             │
│  5. Creates BroadcastChannel('panel-componentId')               │
│  6. router-outlet renders child component                       │
│                                                                  │
│  Components:                                                     │
│  - Check isInPopOut() for behavior branching                    │
│  - Subscribe to getMessages$() for state updates                │
│  - Send messages instead of URL navigation                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Three-Way Comparison

| Aspect | Golden Layout | Dockview | SimplePrime |
|--------|--------------|----------|-------------|
| **Popout URL** | Same URL + `?gl-window=key` | Blank `/popout.html` | `/popout/:grid/:id/:type` |
| **Config Transfer** | localStorage (read & delete) | None (DOM injection) | Angular routing params |
| **JS in Popout** | Full app reload | None (parent owns all) | Full Angular app |
| **State Location** | Each window has own state | Parent only | Each window + sync |
| **Communication** | CustomEvent + window refs | N/A (same context) | BroadcastChannel |
| **Style Handling** | Preserves existing | Copies all styleSheets | Full app styles |
| **Context Awareness** | `container.isPopout` | N/A | `isInPopOut()` / `IS_POPOUT_TOKEN` |
| **Component Behavior** | Can differ | Identical | Differs (message vs URL) |
| **Window Close Detection** | `beforeunload` event | `beforeunload` event | Polling (500ms) |
| **Cleanup** | Manual `closeAllOpenPopouts()` | Automatic | `beforeunload` handler |

### Message Types Comparison

| Golden Layout | Dockview | SimplePrime |
|--------------|----------|-------------|
| `userBroadcast` only | N/A | `STATE_UPDATE` |
| | | `CLOSE_POPOUT` |
| | | `PANEL_READY` |
| | | `PICKER_SELECTION_CHANGE` |
| | | `FILTER_ADD/REMOVE` |
| | | `URL_PARAMS_CHANGED` |
| | | `CHART_CLICK` |

### Architectural Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Golden Layout** | URL-meaningful, bookmarkable, survives parent close | Full reload, manual sync, component registration |
| **Dockview** | Fast, simple state, no messaging | Meaningless URL, dies with parent, requires blank page |
| **SimplePrime** | URL-First, Angular routing, typed messages | Full reload, components aware of context, dual code paths |

---

## Key Insight: Context Awareness is Universal

Both Golden Layout and SimplePrime have components that know about popout context:
- Golden Layout: `container.isPopout`
- SimplePrime: `isInPopOut()` and `IS_POPOUT_TOKEN`

Only Dockview avoids this - but only because it doesn't run any JS in the popout window.

**The earlier goal of "context-unaware components" was overly purist.** The practical approach is:
1. **Accept context awareness** - components legitimately behave differently
2. **Minimize branching** - keep logic identical, only communication differs
3. **Use injection tokens** - `IS_POPOUT_TOKEN` for DI-based decisions
4. **CSS for visual differences** - `popout-body` class for styling

---

## Recommendations for SimplePrime

1. **Keep the current architecture** - it's a valid hybrid of Golden Layout (URL-based) and modern messaging (BroadcastChannel)

2. **Standardize the pattern** - components should:
   ```typescript
   constructor(@Optional() @Inject(IS_POPOUT_TOKEN) private isPopout: boolean) {}

   onAction() {
       if (this.isPopout) {
           this.sendMessage({ type: 'ACTION', payload });
       } else {
           this.urlStateService.navigate(payload);
       }
   }
   ```

3. **Consider abstracting the branching** - create a `StateActionService` that handles the popout check internally:
   ```typescript
   // Hides the isPopout check from components
   stateActionService.updateFilters(filters);  // Internally routes to URL or message
   ```

---

## Assessment: Which Approach is Best for URL-First?

### Dockview is NOT Suitable for URL-First Requirements

Dockview's DOM-injection approach has one advantage: **speed** (no app reload, instant popout). But this comes with fatal tradeoffs:

| Requirement | Dockview Support |
|-------------|------------------|
| Meaningful URLs | ❌ `/popout.html` tells nothing |
| Bookmarkable popouts | ❌ No state in URL |
| Deep linking | ❌ Can't share specific panel state |
| Independent window lifecycle | ❌ Popout dies with parent |
| Shareable URLs | ❌ State in parent's JS memory |

**Verdict:** Dockview's approach is a non-starter for URL-First applications.

### Golden Layout is Closer to Our Needs

Golden Layout uses URL-based popouts with config passed via localStorage:
- Each window is a full app instance
- Windows can survive parent close (with `popInOnClose: false`)
- Config is serialized and passed through URL parameter

However, it has drawbacks:
- localStorage indirection adds complexity
- CustomEvent + `opener` references are fragile
- Must register all components before initialization

### SimplePrime's Approach is Optimal for URL-First

Our hybrid approach combines the best of both:

| Aspect | Our Approach | Why It's Better |
|--------|--------------|-----------------|
| **URL** | `/popout/:gridId/:componentId/:type` | Explicit, readable, bookmarkable |
| **Routing** | Standard Angular routes | No special infrastructure needed |
| **Messaging** | BroadcastChannel | Cleaner than CustomEvent + opener refs |
| **State** | URL params + sync | True URL-First compliance |
| **Deep linking** | Full support | Any popout state is shareable |

### The Cost of URL-First in Popouts

The `isInPopOut()` checks in components are the **necessary cost** of having meaningful URLs:

```typescript
// This branching is unavoidable for URL-First popouts
if (this.isInPopOut()) {
    this.sendMessage({ type: 'URL_PARAMS_CHANGED', payload });
} else {
    this.urlStateService.navigate(payload);
}
```

**Why?** Because the popout needs to:
1. Receive state updates from main window (it has its own URL)
2. Send user actions back to main window (to update the canonical URL)

Dockview avoids this only by sacrificing URL meaning entirely.

### Final Recommendation

**Keep the current SimplePrime architecture.** It correctly prioritizes URL-First principles while providing the cross-window synchronization needed for a cohesive UX.

The component context awareness (`isInPopOut()`, `IS_POPOUT_TOKEN`) is not a design flaw - it's the correct trade-off for maintaining meaningful, bookmarkable, shareable URLs in popout windows.

---

## Source Files Analyzed

```
node_modules/golden-layout/src/ts/
├── controls/browser-popout.ts    # Window creation & lifecycle
├── virtual-layout.ts             # Subwindow detection & setup
└── utils/event-hub.ts            # Cross-window communication

node_modules/dockview-core/dist/esm/
├── popoutWindow.js               # Window creation & DOM injection
├── dom.js                        # Style copying (addStyles)
└── dockview/dockviewComponent.js # Popout orchestration

frontend/src/framework/
├── services/popout-manager.service.ts   # Parent window orchestration
├── services/popout-context.service.ts   # BroadcastChannel wrapper
├── tokens/popout.token.ts               # IS_POPOUT_TOKEN
├── models/popout.interface.ts           # Message types & interfaces
└── features/popout/popout.component.ts  # Child window shell
```
