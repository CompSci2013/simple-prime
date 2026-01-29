# UI Component Analysis: Pickers & Tables

**Last Updated**: 2025-11-26
**Purpose**: Data-driven analysis of what UI components make sense for the generic-prime frontend

---

## Application Versions

| Port | Name | Status | Description |
|------|------|--------|-------------|
| **4201** | autos-prime-ng (Reference) | Mature | Nearly all features working, no major bugs. Legacy picker/table implementation (not configuration-driven). |
| **4205** | generic-prime (New) | Partial | Configuration-driven picker/table system. Partially implemented, has known bugs (#11, #10, #7). |

**URLs**:
- Reference: `http://192.168.0.244:4201/discover`
- New: `http://192.168.0.244:4205/discover`

---

## Data Summary

| Dimension | Count | Suitable For |
|-----------|-------|--------------|
| Manufacturers | **72** | Picker (list/tree) |
| Unique Models | **818** | Dependent picker or nested |
| Manufacturer-Model Combos | **881** | Flat picker (if needed) |
| Vehicle Specs | **4,887** | Results table |
| VIN Records | **55,463** | Expandable rows or separate table |
| Body Classes | **12** | Checkbox chips |
| Data Sources | **2** | Checkbox |
| Year Range | 1908-2024 | Range slider |

---

## 1. PICKERS (Selection Components)

### 1.1 Manufacturer Picker ✅ RECOMMENDED

**Data**: 72 manufacturers
**UI Type**: Searchable list with counts

```
┌─────────────────────────────────────────┐
│ 🔍 Search manufacturers...              │
├─────────────────────────────────────────┤
│ ☐ Chevrolet                    (849)    │
│ ☐ Ford                         (665)    │
│ ☐ Buick                        (480)    │
│ ☐ Chrysler                     (415)    │
│ ☐ Dodge                        (390)    │
│ ...                                     │
└─────────────────────────────────────────┘
```

**Why it works**:
- 72 items is manageable
- Clear hierarchy (top-level filter)
- Counts show data distribution

**Backend Query**:
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": { "field": "manufacturer.keyword", "size": 100, "order": {"_key": "asc"} }
    }
  }
}'
```

---

### 1.2 Manufacturer-Model Picker (Hierarchical) ✅ RECOMMENDED

**Data**: 72 manufacturers → 818 models (881 unique combos)
**UI Type**: Expandable tree or nested table

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search...                                    │
├─────────────────────────────────────────────────┤
│ ▶ ☐ Chevrolet (112 models, 849 specs)          │
│ ▼ ☑ Ford (111 models, 665 specs)               │
│   │  ☐ Bronco                          (42)    │
│   │  ☑ F-150                           (38)    │
│   │  ☐ Mustang                         (35)    │
│   │  ☐ Explorer                        (28)    │
│   └─ ...                                       │
│ ▶ ☐ Buick (31 models, 480 specs)               │
└─────────────────────────────────────────────────┘
```

**Why it works**:
- Chevrolet has 112 models, Ford has 111 - tree structure handles this well
- User can select at manufacturer level (all models) or specific models
- Expandable keeps UI clean

**Backend Query**:
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": { "field": "manufacturer.keyword", "size": 100, "order": {"_key": "asc"} },
      "aggs": {
        "models": {
          "terms": { "field": "model.keyword", "size": 200, "order": {"_key": "asc"} }
        }
      }
    }
  }
}'
```

---

### 1.3 Flat Manufacturer-Model Picker ⚠️ ALTERNATIVE

**Data**: 881 unique manufacturer-model combinations
**UI Type**: Flat table with two columns

```
┌──────────────────────────────────────────────────┐
│ 🔍 Search...                                     │
├────┬───────────────┬────────────────┬────────────┤
│ ☐  │ Manufacturer  │ Model          │ Specs      │
├────┼───────────────┼────────────────┼────────────┤
│ ☐  │ Chevrolet     │ Corvette       │ 73         │
│ ☐  │ Chevrolet     │ Suburban       │ 91         │
│ ☑  │ Ford          │ F-150          │ 38         │
│ ☐  │ Ford          │ Mustang        │ 35         │
└────┴───────────────┴────────────────┴────────────┘
```

**Why use this**:
- Simpler implementation (no tree)
- 881 items is on the edge of usable (needs good search/filter)
- Better for keyboard navigation

**Backend Query** (Composite Aggregation):
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "combos": {
      "composite": {
        "size": 1000,
        "sources": [
          { "manufacturer": { "terms": { "field": "manufacturer.keyword" } } },
          { "model": { "terms": { "field": "model.keyword" } } }
        ]
      }
    }
  }
}'
```

---

### 1.4 Body Class Picker ✅ RECOMMENDED

**Data**: 12 body classes
**UI Type**: Checkbox chips or simple list

```
┌───────────────────────────────────────────────────────────┐
│ Body Class:                                               │
│ [Sedan 2615] [SUV 998] [Coupe 494] [Pickup 290]          │
│ [Van 167] [Hatchback 109] [Sports Car 109]               │
│ [Touring Car 38] [Wagon 38] [Convertible 21]             │
│ [Truck 5] [Limousine 3]                                  │
└───────────────────────────────────────────────────────────┘
```

**Why it works**:
- Only 12 items - perfect for chips
- Counts help user understand distribution
- Multi-select makes sense

**Backend Query**:
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "body_classes": {
      "terms": { "field": "body_class", "size": 20 }
    }
  }
}'
```

---

### 1.5 Year Range Picker ✅ RECOMMENDED

**Data**: 1908 - 2024 (117 years, ~55 specs per year)
**UI Type**: Range slider or dual dropdowns

```
┌────────────────────────────────────────────┐
│ Year Range:                                │
│                                            │
│   1908 ●━━━━━━━━━━━━━━━━━━━━━━━━━● 2024   │
│        [1950]              [2000]          │
│                                            │
│   Or: [1950 ▼] to [2000 ▼]                │
└────────────────────────────────────────────┘
```

**Why it works**:
- Years are evenly distributed (~55-60 specs per year)
- Range selection is intuitive for time
- Slider provides visual feedback

**Backend Query**:
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "year_stats": { "stats": { "field": "year" } }
  }
}'
```

---

### 1.6 Data Source Picker ⚠️ OPTIONAL

**Data**: 2 data sources
**UI Type**: Simple checkboxes

```
☑ synthetic_historical (4,094)
☐ nhtsa_vpic_large_sample (793)
```

**Note**: With only 2 options, this might not need a full picker. Could be a simple toggle or filter chip.

---

## 2. RESULTS TABLES

### 2.1 Vehicle Specs Table ✅ PRIMARY RESULTS

**Data**: 4,887 vehicle specifications
**Rows**: Paginated (20-50 per page)

```
┌────────────────┬────────────────┬──────┬────────────┬──────────────┬───────┐
│ Manufacturer   │ Model          │ Year │ Body Class │ Data Source  │ VINs  │
├────────────────┼────────────────┼──────┼────────────┼──────────────┼───────┤
│ ▶ Chevrolet    │ Corvette       │ 2020 │ Sports Car │ nhtsa_vpic   │ 12    │
│ ▶ Ford         │ F-150          │ 2021 │ Pickup     │ synthetic    │ 11    │
│ ▼ Ford         │ Mustang        │ 2019 │ Coupe      │ nhtsa_vpic   │ 8     │
│   └─ VIN: 1FA6P8CF1K5123456, Mileage: 45,000, Value: $28,500      │       │
│   └─ VIN: 1FA6P8CF2K5123457, Mileage: 32,000, Value: $31,200      │       │
│ ▶ Dodge        │ Charger        │ 2022 │ Sedan      │ synthetic    │ 15    │
└────────────────┴────────────────┴──────┴────────────┴──────────────┴───────┘
```

**Features**:
- Server-side pagination
- Sortable columns
- Filterable by pickers above
- **Expandable rows** to show VINs
- VIN count column (joined from autos-vins)

**Backend Query** (Vehicle Details):
```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "from": 0,
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "term": { "manufacturer.keyword": "Ford" } }
      ]
    }
  },
  "sort": [
    { "manufacturer.keyword": "asc" },
    { "model.keyword": "asc" },
    { "year": "desc" }
  ]
}'
```

---

### 2.2 VIN Expansion (Within Vehicle Specs Table) ✅ RECOMMENDED

**Data**: ~11 VINs per vehicle spec (average)
**UI Type**: Expandable row content

```
When user clicks ▶ on a vehicle row:
┌─────────────────────────────────────────────────────────────────────────┐
│ VINs for Ford Mustang 2019 (8 records)                                  │
├──────────────────────┬─────────┬───────────┬──────────┬────────────────┤
│ VIN                  │ Mileage │ Condition │ Value    │ State          │
├──────────────────────┼─────────┼───────────┼──────────┼────────────────┤
│ 1FA6P8CF1K5123456    │ 45,000  │ Good      │ $28,500  │ CA             │
│ 1FA6P8CF2K5123457    │ 32,000  │ Excellent │ $31,200  │ TX             │
│ 1FA6P8CF3K5123458    │ 78,000  │ Fair      │ $22,100  │ FL             │
└──────────────────────┴─────────┴───────────┴──────────┴────────────────┘
```

**Why it works**:
- Natural hierarchy: Vehicle Spec → VINs
- Average ~11 VINs per spec is manageable
- Lazy-loads only when expanded

**Backend Query** (VINs for specific vehicle):
```bash
curl -s "http://localhost:9200/autos-vins/_search" -H 'Content-Type: application/json' -d '{
  "size": 50,
  "query": {
    "term": { "vehicle_id": "nhtsa-ford-mustang-2019" }
  },
  "sort": [{ "mileage": "asc" }]
}'
```

---

### 2.3 Standalone VIN Browser ⚠️ OPTIONAL

**Data**: 55,463 VIN records
**UI Type**: Separate paginated table

```
┌──────────────────────┬───────────────┬────────────┬──────┬─────────┬──────────┐
│ VIN                  │ Manufacturer  │ Model      │ Year │ Mileage │ Value    │
├──────────────────────┼───────────────┼────────────┼──────┼─────────┼──────────┤
│ 1FA6P8CF1K5123456    │ Ford          │ Mustang    │ 2019 │ 45,000  │ $28,500  │
│ 1PLBP40E9CF100000    │ Plymouth      │ Horizon    │ 1982 │ 523,377 │ $33,715  │
└──────────────────────┴───────────────┴────────────┴──────┴─────────┴──────────┘
```

**When to use**:
- User wants to search for specific VIN
- User wants to filter by condition, mileage, value
- User wants to see all VINs regardless of vehicle spec

**When NOT to use**:
- Default browsing (use vehicle specs table instead)
- 55K records is too many to browse without filters

---

## 3. WHAT DOESN'T MAKE SENSE

### ❌ VIN Picker
- 55,463 items - far too many
- VINs are the detail data, not selection criteria

### ❌ Year Picker (as list)
- 117 years is too many for a list
- Range picker is better

### ❌ Vehicle Specs as Picker
- 4,887 items - this IS the results table
- Don't use results data as selection criteria

### ❌ Manufacturer-Model-Year Picker
- 4,887 combinations = results table
- Picker should be manufacturer + model, results show years

---

## 4. RECOMMENDED UI ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DISCOVER PAGE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PICKERS ROW                                                          │   │
│  │                                                                       │   │
│  │  [Manufacturer ▼]  [Body Class: chips...]  [Year: 1950-2000]         │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MANUFACTURER-MODEL PICKER (Hierarchical Tree)                        │   │
│  │                                                                       │   │
│  │  ▶ ☐ Chevrolet (112 models)                                          │   │
│  │  ▼ ☑ Ford (111 models)                                               │   │
│  │    ├─ ☐ Bronco (42)                                                  │   │
│  │    ├─ ☑ F-150 (38)                                                   │   │
│  │    └─ ☑ Mustang (35)                                                 │   │
│  │  ▶ ☐ Buick (31 models)                                               │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ VEHICLE SPECS TABLE (Results) - 4,887 records                        │   │
│  │                                                                       │   │
│  │  Manufacturer │ Model    │ Year │ Body Class │ VINs                  │   │
│  │  ─────────────┼──────────┼──────┼────────────┼──────                 │   │
│  │  ▶ Ford       │ F-150    │ 2021 │ Pickup     │ 12                    │   │
│  │  ▼ Ford       │ Mustang  │ 2020 │ Coupe      │ 8     ← EXPANDED      │   │
│  │    └─ VIN: 1FA6P8CF1K5123456 │ 45,000 mi │ $28,500                   │   │
│  │    └─ VIN: 1FA6P8CF2K5123457 │ 32,000 mi │ $31,200                   │   │
│  │  ▶ Ford       │ Mustang  │ 2019 │ Coupe      │ 11                    │   │
│  │                                                                       │   │
│  │  [< Prev] Page 1 of 245 [Next >]                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SUMMARY TABLE

| Component | Data Source | Records | Type | Priority |
|-----------|-------------|---------|------|----------|
| Manufacturer Picker | autos-unified | 72 | List with counts | HIGH |
| Manufacturer-Model Picker | autos-unified | 881 combos | Tree/Nested | HIGH |
| Body Class Picker | autos-unified | 12 | Checkbox chips | HIGH |
| Year Range Picker | autos-unified | 1908-2024 | Range slider | MEDIUM |
| Data Source Picker | autos-unified | 2 | Checkbox | LOW |
| Vehicle Specs Table | autos-unified | 4,887 | Paginated table | HIGH |
| VIN Expansion | autos-vins | ~11 per spec | Expandable row | HIGH |
| VIN Browser (standalone) | autos-vins | 55,463 | Separate table | LOW |

---

## 6. BUG #11 RESOLUTION

The current Manufacturer-Model Picker shows "72 entries" because:

1. **Backend returns**: Nested structure with 72 manufacturers
2. **Frontend expects**: Flat list of combinations
3. **Neither is wrong**: The data model supports both

**Recommended Fix**:
- Implement **hierarchical tree picker** (Option 1.2 above)
- Shows 72 manufacturers at top level
- Expands to show models (up to 112 per manufacturer)
- Total selectable items: 881 manufacturer-model combinations
- This matches the actual data structure naturally

---

**Document Created**: 2025-11-26
**Based On**: Direct Elasticsearch queries
