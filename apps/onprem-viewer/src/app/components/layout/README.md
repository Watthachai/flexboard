# Responsive Layout System

This layout system provides responsive dashboard capabilities with automatic widget positioning, validation, and mobile optimization.

## Features

### 📱 Responsive Design

- **Desktop**: Full grid layout respecting exact positioning from payload
- **Mobile**: Automatic stacking with optimal heights
- **Tablet**: Responsive column reduction for better fit

### ✅ Layout Validation

- **Overflow Prevention**: Widgets that exceed grid boundaries are automatically adjusted
- **Position Validation**: Negative positions are corrected to valid ranges
- **Overlap Detection**: Warns about widget conflicts in development mode

### 🔧 Developer Tools

- **Debug Mode**: Shows layout information in development
- **Console Warnings**: Alerts for layout adjustments and issues
- **Visual Feedback**: Grid information and widget positioning details

## Usage Example

```typescript
// Your payload structure
const manifest = {
  layout: {
    columns: 12,
    rowHeight: 50,
    type: "grid",
  },
  widgets: [
    {
      id: "chart-1",
      layout: {
        x: 0, // Column position (0-based)
        y: 0, // Row position (0-based)
        width: 6, // Columns to span
        height: 8, // Rows to span
      },
    },
  ],
};
```

## Layout Coordinate System

```
Grid (12 columns × dynamic rows):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 0,0 │ 1,0 │ 2,0 │ 3,0 │ 4,0 │ 5,0 │ 6,0 │ 7,0 │ 8,0 │ 9,0 │10,0 │11,0 │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 0,1 │ 1,1 │ 2,1 │ 3,1 │ 4,1 │ 5,1 │ 6,1 │ 7,1 │ 8,1 │ 9,1 │10,1 │11,1 │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

## Responsive Breakpoints

| Screen Size | Columns  | Behavior                  |
| ----------- | -------- | ------------------------- |
| < 640px     | 1        | Full stack, mobile layout |
| 640-768px   | 2        | Reduced columns           |
| 768-1024px  | 4        | Tablet optimization       |
| 1024-1280px | 8        | Small desktop             |
| > 1280px    | Original | Full grid layout          |

## Payload Layout Issues & Solutions

### Problem: Widget Position Out of Bounds

```json
{
  "layout": { "columns": 12 },
  "widgets": [
    {
      "layout": { "x": 13, "width": 6 } // ❌ x=13 exceeds 12 columns
    }
  ]
}
```

**Auto-fix**: Position adjusted to `x: 11, width: 1`

### Problem: Widget Width Overflow

```json
{
  "layout": { "columns": 12 },
  "widgets": [
    {
      "layout": { "x": 8, "width": 6 } // ❌ 8+6=14 exceeds 12 columns
    }
  ]
}
```

**Auto-fix**: Width reduced to `width: 4` (12-8=4)

### Problem: Multiple Widgets Overlap

```json
{
  "widgets": [
    { "layout": { "x": 0, "y": 0, "width": 6, "height": 4 } },
    { "layout": { "x": 3, "y": 2, "width": 6, "height": 4 } } // ❌ Overlaps
  ]
}
```

**Detection**: Development mode shows overlap warnings

## Best Practices

### ✅ Recommended Layout Patterns

```json
// Side-by-side charts
{
  "widgets": [
    { "layout": { "x": 0, "y": 0, "width": 6, "height": 8 } },  // Left half
    { "layout": { "x": 6, "y": 0, "width": 6, "height": 8 } }   // Right half
  ]
}

// Full-width header + two columns
{
  "widgets": [
    { "layout": { "x": 0, "y": 0, "width": 12, "height": 4 } }, // Header
    { "layout": { "x": 0, "y": 4, "width": 6, "height": 8 } },  // Left
    { "layout": { "x": 6, "y": 4, "width": 6, "height": 8 } }   // Right
  ]
}

// Dashboard grid (2×2)
{
  "widgets": [
    { "layout": { "x": 0, "y": 0, "width": 6, "height": 6 } },  // Top-left
    { "layout": { "x": 6, "y": 0, "width": 6, "height": 6 } },  // Top-right
    { "layout": { "x": 0, "y": 6, "width": 6, "height": 6 } },  // Bottom-left
    { "layout": { "x": 6, "y": 6, "width": 6, "height": 6 } }   // Bottom-right
  ]
}
```

### ❌ Common Mistakes

```json
// Don't overlap widgets
{ "layout": { "x": 0, "y": 0, "width": 8, "height": 4 } }
{ "layout": { "x": 4, "y": 2, "width": 8, "height": 4 } }  // ❌ Overlaps

// Don't exceed grid boundaries
{ "layout": { "x": 10, "y": 0, "width": 6, "height": 4 } } // ❌ 10+6 > 12

// Don't use negative positions
{ "layout": { "x": -1, "y": 0, "width": 6, "height": 4 } } // ❌ Negative x

// Don't use zero/negative sizes
{ "layout": { "x": 0, "y": 0, "width": 0, "height": 4 } }  // ❌ Zero width
```

## Development Debug Mode

When `NODE_ENV=development`, the system shows:

- Grid configuration (columns × row height)
- Widget positions and sizes
- Layout overlap warnings
- Screen width and responsive state
- Auto-adjustment notifications

This helps you perfect your dashboard layouts during development!
