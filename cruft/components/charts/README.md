# Charts Component Documentation

This directory contains specifications for the Statistics & Distribution Charts component.

## Contents

- **[specification.md](./specification.md)** - Complete component specification
  - Chart system architecture
  - Data flow and URL-First pattern
  - Visual presentation rules
  - User interactions and outputs
  - Chart-specific behaviors
  - Technical requirements

## Quick Reference

### Charts

1. **Vehicles by Manufacturer** - Top 20 manufacturers, stacked bars
2. **Top Models by VIN Count** - Top 20 models, stacked bars
3. **Vehicles by Year** - All years, stacked bars
4. **Vehicles by Body Class** - All body classes, stacked bars

### Key Patterns

- **URL-First**: Use `UrlStateService.setParams()` NOT `router.navigate()`
- **Delegation**: BaseChartComponent delegates to `dataSource.handleClick()`
- **Server-Side Stats**: Detect and use `{total, highlighted}` format
- **Stacking Order**: ALWAYS Highlighted (blue) on bottom, Other (gray) on top
- **Box Selection**: Handle duplicates from stacked bars using `Set`

### URL Parameters

| Chart | Parameter | Format | Example |
|-------|-----------|--------|---------|
| Manufacturer | `h_manufacturer` | Comma-separated | `Ford,Buick` |
| Models | `h_modelCombos` | Colon-delimited combos | `Ford:F-150,Buick:Century` |
| Year | `h_yearMin`, `h_yearMax` | Range | `1960`, `1970` |
| Body Class | `h_bodyClass` | Comma-separated | `Sedan,SUV,Truck` |

## Implementation Status

✅ **Implemented** - All 10 fixes completed (2025-11-23)

## Historical Context

This specification was created **retroactively** after discovering and fixing 10 critical issues:

1. URL-First architecture compliance
2. Server-side segmented statistics support
3. Stacking order consistency
4. Pipe-to-comma separator normalization
5. Box selection deduplication
6. Box selection delegation pattern
7. Models chart parameter mapping
8. Models chart format conversion
9. Statistics transform limits
10. Manufacturer/Models chart stacking order

These issues would have been prevented if this specification existed upfront.

## Related Documentation

- [Discover Feature Specification](../../../specs/03-discover-feature-specification.md)
- [State Management Specification](../../../specs/04-state-management-specification.md)
- [Component Template](../../templates/COMPONENT-SPECIFICATION-TEMPLATE.md)
