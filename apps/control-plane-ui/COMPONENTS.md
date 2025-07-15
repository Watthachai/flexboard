# Flexboard Control Plane UI

## 🎨 Design System

### พื้นหลังและ Theme

- **Light Mode**: พื้นหลังสีขาวสะอาด
- **Dark Mode**: พื้นหลังสีเข้มที่ดูสบายตา
- **Auto Theme**: ตาม system preference
- **Theme Toggle**: สลับ theme ได้ทุกเมื่อ

### Glassmorphism Effects

- Backdrop blur สำหรับความหรูหรา
- Transparency ที่เหมาะสม
- Shadow และ border ที่นุ่มนวล

## 🏗️ Component Structure

### Layout Components

```
src/components/layout/
├── sidebar.tsx          # Navigation sidebar
└── header.tsx           # Top header with search
```

### Dashboard Components

```
src/components/dashboard/
├── stats-card.tsx       # Statistics display cards
├── recent-tenants.tsx   # Recent tenant list
├── recent-activity.tsx  # Activity feed
└── quick-actions.tsx    # Quick action buttons
```

### UI Components (Shadcn/UI)

```
src/components/ui/
├── button.tsx           # Button component with variants
├── card.tsx             # Card containers
├── input.tsx            # Input fields
└── badge.tsx            # Status badges
```

### Theme Components

```
src/components/
├── theme-provider.tsx   # Theme context provider
└── theme-toggle.tsx     # Dark/Light mode toggle
```

## 🎯 Features

### ✅ Implemented

- [x] Clean white background
- [x] Dark mode support
- [x] Responsive design
- [x] Component separation
- [x] Theme toggle
- [x] Statistics dashboard
- [x] Tenant management
- [x] Activity monitoring
- [x] Search functionality
- [x] Status badges
- [x] Animation effects

### 🚧 Planned Features

- [ ] User management interface
- [ ] Analytics dashboard
- [ ] System settings
- [ ] Real-time updates
- [ ] Advanced filtering
- [ ] Data export
- [ ] Notification system
- [ ] Tenant creation wizard

## 🛠️ Usage

### Theme Toggle

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />;
```

### Stats Card

```tsx
import { StatsCard } from "@/components/dashboard/stats-card";

<StatsCard
  title="Total Users"
  value="1,847"
  change="+23%"
  positive={true}
  icon={Users}
  description="Active users this month"
  index={0}
/>;
```

### Card with Glassmorphism

```tsx
import { Card } from "@/components/ui/card";

<Card className="bg-background/80 backdrop-blur-sm border-border/50">
  Content here
</Card>;
```

## 🎨 Design Tokens

### Colors

- `background`: หลัก background
- `foreground`: หลัก text
- `primary`: สี accent หลัก
- `secondary`: สี accent รอง
- `muted`: สีอ่อนๆ สำหรับ secondary text
- `border`: สี border
- `accent`: สี hover/active states

### Spacing

- `p-4, p-6, p-8`: Padding มาตรฐาน
- `gap-4, gap-6, gap-8`: Grid/Flex gaps
- `space-y-4, space-y-6, space-y-8`: Vertical spacing

### Border Radius

- `rounded-md`: 0.375rem
- `rounded-lg`: 0.5rem
- `rounded-xl`: 0.75rem

### Animations

- `animate-fade-in`: Fade in with slide up
- `animate-float`: Floating animation
- `transition-all duration-200`: Smooth transitions

## 📱 Responsive Breakpoints

- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+

## 🎨 Color Palette

### Light Mode

- Background: `hsl(0 0% 100%)`
- Foreground: `hsl(240 10% 3.9%)`
- Primary: `hsl(221.2 83.2% 53.3%)`

### Dark Mode

- Background: `hsl(240 10% 3.9%)`
- Foreground: `hsl(0 0% 98%)`
- Primary: `hsl(221.2 83.2% 53.3%)`

## 🚀 Performance

- Backdrop blur effects ที่ optimized
- Lazy loading สำหรับ components
- Minimal re-renders
- Smooth animations
- Fast theme switching

## 📋 Best Practices

1. **Component Separation**: แยก components ตาม responsibility
2. **Theme Awareness**: ใช้ CSS variables สำหรับ colors
3. **Responsive First**: Design สำหรับ mobile ก่อน
4. **Accessibility**: Support keyboard navigation
5. **Performance**: Optimize animations และ effects
