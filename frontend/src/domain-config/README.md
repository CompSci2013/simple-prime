# Domain Configuration Layer

**Purpose**: Contains domain-specific configurations, models, and adapters.

**Structure**:

```
domain-config/
└── automobile/              # Automobile domain
    ├── models/              # SearchFilters, VehicleResult, VehicleStatistics
    ├── adapters/            # API adapters, URL mappers, cache key builders
    └── configs/             # Table config, picker configs, domain config
```

## Adding New Domains

To add a new domain (e.g., agriculture):

1. Create folder: `domain-config/agriculture/`
2. Add models: `agriculture/models/`
3. Add adapters: `agriculture/adapters/`
4. Add configs: `agriculture/configs/`
5. Create `agriculture.domain-config.ts`

Each domain is **completely independent** - no shared code between domains.
