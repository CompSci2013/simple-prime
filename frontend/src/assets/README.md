# Static Assets

**Purpose**: Contains static files served directly by the web server without processing. These files are copied as-is to the build output.

## Structure

```
assets/
├── data/                     # Static JSON data files
│   ├── agriculture-crops.json
│   └── agriculture-soil.json
├── deepseek.png              # Application images
└── .gitkeep                  # Placeholder for empty directories
```

## Asset Categories

### Data Files (`data/`)
Static JSON files for mock data or configuration:
- Used during development or for static datasets
- Accessed via HTTP requests to `/assets/data/filename.json`

### Images
Static images for the application:
- Logos, icons, backgrounds
- Accessed via `/assets/image-name.png`

## Usage

### In Templates
```html
<img src="assets/deepseek.png" alt="Logo">
```

### In Components
```typescript
this.http.get<CropData[]>('/assets/data/agriculture-crops.json')
  .subscribe(data => this.crops = data);
```

### In Styles
```scss
background-image: url('/assets/background.png');
```

## Adding New Assets

1. Place file in appropriate subdirectory
2. Reference using `/assets/path/to/file`
3. For new categories, create subdirectory with `.gitkeep`

## Build Configuration

Assets are configured in `angular.json`:
```json
"assets": [
  "src/favicon.ico",
  "src/assets"
]
```

Files in this directory are copied to `dist/assets/` during build.
