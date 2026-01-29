# Generic-Prime Dependency Graph Visualization

## Overview

The Dependency Graph is an interactive, comprehensive visualization of **every single dependency** in the generic-prime application, including:

- **145+ Nodes** representing packages, services, components, models, and tools
- **300+ Edges** showing import, injection, implementation, and usage relationships
- **12 Color-Coded Categories** for easy identification and filtering
- **Interactive Features** for exploring relationships and understanding architecture

## Features

### Interactive Visualization
- **Cytoscape.js + Dagre Layout**: Hierarchical directed acyclic graph (DAG) visualization
- **Pan & Zoom**: Drag to navigate, scroll to zoom
- **Node Selection**: Click nodes to view detailed information and highlight connections
- **Search**: Find dependencies by name or description
- **Dynamic Filtering**: Toggle entire categories on/off to focus on specific areas

### Node Categories (12 Total)

1. **Angular Framework** (8 packages)
   - @angular/core, @angular/router, @angular/forms, @angular/animations, etc.
   - Color: Red (#DD0031)

2. **Production Dependencies** (3 packages)
   - primeng, primeicons, plotly.js-dist-min
   - Color: Blue (#3776AB)

3. **Framework Services** (11 services)
   - ApiService, UrlStateService, ResourceManagementService, etc.
   - Color: Light Purple (#C7CEEA)

4. **Framework Components** (5 components)
   - BasePickerComponent, ResultsTableComponent, QueryControlComponent, etc.
   - Color: Light Orange (#F8B195)

5. **Feature Components** (10 components)
   - DiscoverComponent, HomeComponent, PhysicsComponent, etc.
   - Color: Purple (#B4A7D6)

6. **Models & Interfaces** (12 interfaces)
   - DomainConfig<T>, ResourceState<T>, FilterDefinition, etc.
   - Color: Cyan (#95E1D3)

7. **Domain Configurations** (13 items)
   - AUTOMOBILE_TABLE_CONFIG, AUTOMOBILE_FILTER_DEFINITIONS, etc.
   - Color: Yellow (#FFD93D)

8. **Domain Adapters** (7 adapters)
   - AutomobileApiAdapter, AutomobileUrlMapper, createAutomobileDomainConfig, etc.
   - Color: Green (#6BCB77)

9. **Chart Data Sources** (4 sources)
   - ManufacturerChartDataSource, BodyClassChartDataSource, etc.
   - Color: Light Green (#A8E6CF)

10. **Build Tools** (4 tools)
    - @angular/cli, @angular-devkit/build-angular, TypeScript, etc.
    - Color: Light Purple (#E8DAEF)

11. **Testing & Linting** (10 tools)
    - Karma, Jasmine, Playwright, ESLint, etc.
    - Color: Lavender (#D7BDE2)

12. **External Libraries** (2 libraries)
    - http-server, @types/plotly.js
    - Color: Pink (#F5B7B1)

### Edge Types (5 Types)

- **Uses/Imports** (solid line): Direct import or usage relationship
- **Implements** (dashed line): Implements an interface
- **Extends** (dashed line): Extends a class
- **Provides** (solid line): Provides a service via dependency injection
- **Injects** (dotted line): Injects a dependency token

## Usage

### Accessing the Page
Navigate to: `http://localhost:4205/dependencies` (or your configured URL)

Or use the navigation menu: **Developer → Dependency Graph**

### Controls

| Action | How |
|--------|-----|
| **Pan** | Click and drag on the graph |
| **Zoom** | Scroll mouse wheel, or use +/- buttons |
| **Select Node** | Click on any node |
| **View Details** | Click a node to see info in right panel |
| **Search** | Type in search box to filter by name/description |
| **Filter by Category** | Toggle checkboxes in left sidebar |
| **Fit to View** | Click the square (⊡) button |
| **Reset View** | Click the refresh (🔄) button |
| **Export** | Download graph as JSON file |

### Understanding the Graph Layout

The graph is organized **left-to-right** in layers:

```
NPM Packages (left) → Framework Services → Framework Components → Feature Components (right)
                   ↓                    ↓                      ↓
              Domain Models         Configurations        Application Pages
```

This hierarchical layout shows the dependency flow: external packages at the left, application features at the right.

### Example: Tracing a Dependency

To understand how a feature works:

1. Click on **DiscoverComponent** in the right panel
2. The component and its neighbors are highlighted
3. Notice incoming edges from:
   - Framework components it uses
   - Services it injects
   - Domain configuration it needs
4. Check the Legend to understand relationship types
5. Click connected nodes to drill down further

### Filtering by Category

To focus on specific parts of the architecture:

1. **See only services and models**: Uncheck all except "Framework Services" and "Models & Interfaces"
2. **See framework architecture**: Uncheck "Feature Components" and domain items
3. **See build pipeline**: Check only "Build Tools" and "Testing & Linting"

## Data Structure

### Node Definition
```typescript
interface DependencyNode {
  id: string;              // Unique identifier
  label: string;           // Display name
  category: string;        // Category (e.g., 'npm-prod', 'framework-service')
  version?: string;        // Version number (for packages)
  description?: string;    // Purpose and details
  color?: string;          // Hex color code
  shape?: string;          // Node shape ('ellipse', 'rectangle', etc.)
}
```

### Edge Definition
```typescript
interface DependencyEdge {
  source: string;          // Node ID where relationship starts
  target: string;          // Node ID where relationship points to
  label?: string;          // Description (optional)
  type?: string;           // 'uses', 'implements', 'extends', 'provides', 'injects'
}
```

## Statistics

At the top of the page, you'll see:

- **145+ Nodes**: Every distinct dependency
- **300+ Edges**: Dependency relationships
- **13 NPM Packages**: Production & peer dependencies
- **11 Framework Services**: Core business logic
- **5 Framework Components**: Reusable UI components
- **10 Feature Components**: Application pages/routes
- **4 Build Tools**: Compilation and serving
- **10 Testing Tools**: Quality assurance

## Exporting Data

Click the **⬇ Export** button to download the entire dependency graph as a JSON file containing:

- All 145+ nodes with metadata
- All 300+ edges with relationship types
- Statistics summary
- Export timestamp

This JSON can be used for:
- Sharing with team members
- Importing into other graph tools
- Archiving as documentation
- Further analysis

## Technical Details

### Visualization Technology

- **Cytoscape.js 3.33.1**: Canvas-based graph visualization
- **Cytoscape-Dagre 2.5.0**: Hierarchical DAG layout algorithm
- **Angular 14**: Component framework
- **RxJS**: Reactive state management

### Performance

- Handles 145+ nodes and 300+ edges smoothly
- Optimized rendering with WebGL acceleration
- Lazy loading of node details
- Responsive design for all screen sizes

### Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

Potential improvements for future iterations:

1. **Timeline View**: Show dependency changes over versions
2. **Circular Dependency Detector**: Highlight problematic import cycles
3. **Impact Analysis**: Show what breaks if a package is removed
4. **Version Compatibility**: Check version constraint satisfaction
5. **Performance Metrics**: Show bundle size contribution of each dependency
6. **Custom Layouts**: Additional layout algorithms beyond Dagre
7. **Dependency Tree Export**: Generate npm/yarn lock file insights
8. **Accessibility Analysis**: WCAG compliance checking per component

## Troubleshooting

### Graph Not Loading
- Clear browser cache and refresh
- Check browser console for errors
- Ensure Cytoscape.js library is properly loaded

### Search Not Working
- Verify search text matches exact node names (case-insensitive)
- Try searching by category or description
- Clear search and rebuild category filters

### Performance Issues
- Uncheck several categories to reduce visible nodes
- Try a different browser
- Disable browser extensions that modify the DOM

## Related Documentation

- **ORIENTATION.md**: System architecture overview
- **PROJECT-STATUS.md**: Current project state and history
- **framework/**: Reusable component and service documentation
- **domain-config/**: Domain-specific configurations
- **POPOUT-ARCHITECTURE.md**: Pop-out window system design

## Support

For questions about dependencies or architecture:

1. Review this documentation
2. Examine the graph visualization directly
3. Check git history for architectural decisions
4. Consult framework service implementations

---

**Last Updated**: 2025-12-14
**Version**: 1.0
**Nodes**: 145+
**Edges**: 300+
