// Control Plane Admin Dashboard Structure
// Based on Hybrid Analytics Platform Architecture v1.0

flexboard/
└── apps/control-plane-ui/
├── app/ # Next.js App Router
│ ├── (auth)/ # Auth group routing
│ │ ├── login/
│ │ │ └── page.tsx
│ │ └── register/
│ │ └── page.tsx
│ ├── (dashboard)/ # Protected dashboard routes
│ │ ├── layout.tsx # Dashboard layout with sidebar
│ │ ├── page.tsx # Main dashboard overview
│ │ ├── tenants/ # Tenant Management
│ │ │ ├── page.tsx # Tenant list view
│ │ │ ├── [id]/
│ │ │ │ └── page.tsx # Tenant detail view
│ │ │ └── create/
│ │ │ └── page.tsx # Create new tenant
│ │ ├── dashboards/ # Dashboard Builder
│ │ │ ├── page.tsx # Dashboard list
│ │ │ ├── [id]/
│ │ │ │ ├── page.tsx # Dashboard builder interface
│ │ │ │ └── preview/
│ │ │ │ └── page.tsx # Preview mode
│ │ │ └── create/
│ │ │ └── page.tsx # Create dashboard wizard
│ │ ├── metadata/ # Metadata Version Control
│ │ │ ├── page.tsx # Version history
│ │ │ └── [version]/
│ │ │ └── page.tsx # Version comparison
│ │ ├── analytics/ # Platform Analytics
│ │ │ └── page.tsx # Usage analytics, sync logs
│ │ └── settings/ # Admin Settings
│ │ └── page.tsx # Platform configuration
│ ├── api/ # API Routes
│ │ ├── auth/ # Authentication endpoints
│ │ ├── tenants/ # Tenant management API
│ │ ├── dashboards/ # Dashboard CRUD API
│ │ └── sync/ # Agent sync endpoints
│ ├── globals.css # Global styles + glassmorphism
│ ├── layout.tsx # Root layout
│ └── loading.tsx # Global loading component
│
├── components/ # Reusable UI Components
│ ├── ui/ # shadcn/ui components (base)
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── dialog.tsx
│ │ ├── form.tsx
│ │ ├── input.tsx
│ │ ├── table.tsx
│ │ └── ...
│ ├── auth/ # Authentication components
│ │ ├── login-form.tsx
│ │ ├── register-form.tsx
│ │ └── auth-provider.tsx
│ ├── dashboard/ # Dashboard specific components
│ │ ├── sidebar.tsx # Glassmorphism sidebar
│ │ ├── header.tsx # Top navigation
│ │ ├── overview-cards.tsx # Stats cards with glass effect
│ │ └── quick-actions.tsx # Action buttons
│ ├── tenants/ # Tenant management components
│ │ ├── tenant-list.tsx # Table with glassmorphism
│ │ ├── tenant-card.tsx # Individual tenant card
│ │ ├── create-tenant-dialog.tsx
│ │ └── tenant-status-badge.tsx
│ ├── builder/ # Dashboard Builder components
│ │ ├── canvas.tsx # Drag-and-drop canvas
│ │ ├── widget-palette.tsx # Widget selection panel
│ │ ├── property-panel.tsx # Widget configuration
│ │ ├── preview-frame.tsx # Live preview
│ │ └── version-control.tsx # Version management
│ ├── charts/ # Chart components
│ │ ├── usage-chart.tsx # Platform usage analytics
│ │ ├── sync-status-chart.tsx
│ │ └── tenant-metrics.tsx
│ └── common/ # Common components
│ ├── glass-card.tsx # Glassmorphism card component
│ ├── animated-counter.tsx # Number animations
│ ├── loading-spinner.tsx # iOS-style loading
│ └── confirmation-dialog.tsx
│
├── lib/ # Utilities and configurations
│ ├── auth.ts # Authentication logic
│ ├── api.ts # API client configuration
│ ├── utils.ts # Utility functions
│ ├── validations.ts # Zod schemas for validation
│ ├── constants.ts # App constants
│ └── types.ts # TypeScript type definitions
│
├── hooks/ # Custom React hooks
│ ├── use-auth.ts # Authentication hook
│ ├── use-tenants.ts # Tenant data management
│ ├── use-dashboards.ts # Dashboard operations
│ ├── use-analytics.ts # Analytics data
│ └── use-glass-effect.ts # Glassmorphism utilities
│
├── services/ # Business logic and API calls
│ ├── auth.service.ts # Authentication service
│ ├── tenant.service.ts # Tenant operations
│ ├── dashboard.service.ts # Dashboard CRUD operations
│ ├── metadata.service.ts # Version control operations
│ └── analytics.service.ts # Analytics data fetching
│
├── styles/ # Styling
│ ├── globals.css # Global CSS + glassmorphism
│ ├── animations.css # Custom animations
│ └── glass-effects.css # Glassmorphism utilities
│
├── middleware.ts # Next.js middleware for auth
├── next.config.js # Next.js configuration
├── tailwind.config.js # Tailwind + glassmorphism config
└── package.json

## Key Features to Implement:

### 🎨 Glassmorphism Design System

- Glass cards with backdrop-blur-xl
- Semi-transparent backgrounds
- Subtle borders and shadows
- iOS-inspired color palette

### 🏗️ Dashboard Builder

- Drag-and-drop widget creation
- Real-time preview
- Version control with git-like interface
- Metadata management

### 👥 Tenant Management

- Multi-tenant dashboard
- API key generation
- License management
- Usage analytics per tenant

### 📊 Analytics & Monitoring

- Sync status monitoring
- Usage metrics
- Performance dashboards
- Real-time updates

### 🔐 Security & Auth

- JWT-based authentication
- Role-based access control
- API key management
- Secure metadata storage
