# Chart Components

This folder contains modular chart components for the OnPrem Dashboard Viewer.

## Structure

```
charts/
├── index.ts          # Export all components
├── types.ts          # Shared interfaces and constants
├── BarChart.tsx      # Bar chart component
├── LineChart.tsx     # Line chart component
├── PieChart.tsx      # Pie chart component
└── README.md         # This file
```

## Usage

```typescript
import { BarChart, LineChart, PieChart } from './charts';

// Use in your component
<BarChart
  data={myData}
  xAxis="productName"
  yAxis="quantity"
  title="Product Sales"
/>
```

## Base Props Interface

All chart components extend `BaseChartProps`:

```typescript
interface BaseChartProps {
  data: any[]; // Raw data array
  xAxis: string; // Column name for X-axis
  yAxis: string; // Column name for Y-axis
  title: string; // Chart title
  colors?: string[]; // Optional custom color palette
}
```

## Features

### Data Processing

- **Automatic grouping**: Groups data by X-axis values and sums Y-axis values
- **Type conversion**: Automatically converts Y-axis values to numbers
- **Filtering**: Removes invalid/empty data points
- **Sorting**: Smart sorting for better visualization

### Chart-Specific Features

#### BarChart

- Shows top 10 data points by value
- Responsive bar sizing
- Hover tooltips with exact values
- Data summary at bottom

#### LineChart

- Shows up to 15 data points for readability
- Smart sorting (numeric or alphabetic)
- Smooth line curves with data point markers
- Trend visualization optimized

#### PieChart

- Shows top 6 segments to avoid clutter
- Percentage labels (only for slices > 5%)
- Color-coded legend
- Total value summary

### Visual Design

- **Consistent styling**: All charts use the same color palette and design system
- **Responsive**: Auto-sizing containers work on any screen size
- **Professional tooltips**: Styled tooltips with proper formatting
- **Empty state handling**: Graceful fallbacks when no data is available

## Adding New Chart Types

1. Create new component file (e.g., `ScatterChart.tsx`)
2. Implement `BaseChartProps` interface
3. Add data processing logic
4. Export from `index.ts`
5. Add case to `DashboardViewer.tsx` switch statement

## Dependencies

- **Recharts**: Professional chart library for React
- **React**: Component framework
- **TypeScript**: Type safety and better DX
