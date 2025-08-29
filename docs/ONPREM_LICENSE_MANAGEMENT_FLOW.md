# OnPrem License Management - Correct Architecture

## ✅ Corrected Understanding: License-Based Dashboard Access

### 🔑 Firebase API Key Purpose:

**Firebase API Key = Admin Authentication for License Management**

```
Firebase Tenant Document
├─ tenantId: "vpi-co-ltd"
├─ apiKey: "tenant-1753950967508-84yme8k73"  ← Admin Auth Key
└─ dashboards: [...]
           │
           └─ Used ONLY for license management operations
```

### 📊 License Key Purpose:

**License Key = Customer Access Control to Specific Dashboards**

```
Generated License Key: "FLX-VPI-CO-LTD-20240801-ABC123"
├─ tenantId: "vpi-co-ltd"
├─ allowedDashboards: ["sales-dashboard", "analytics-dashboard"]
├─ features: ["dashboard-viewer", "data-export"]
└─ expiryDate: "2025-12-31"
           │
           └─ Determines WHAT customer can see
```

## 🏗️ Correct System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN WORKFLOW                              │
│                                                                 │
│  1. Admin opens Control Plane UI                               │
│     http://localhost:3003/tenants/vpi-co-ltd/onprem-licenses   │
│                                                                 │
│  2. Admin generates license using Firebase API Key             │
│     POST /api/tenants/vpi-co-ltd/onprem-licenses              │
│     Body: {                                                     │
│       adminKey: "tenant-1753950967508-84yme8k73", ← Firebase   │
│       dashboardIds: ["sales-dashboard"],          ← What customer can see │
│       email: "customer@company.com"                            │
│     }                                                          │
│                                                                 │
│  3. System generates license key                               │
│     → "FLX-VPI-CO-LTD-20240801-ABC123"                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ License Key
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CUSTOMER WORKFLOW                             │
│                                                                 │
│  1. Customer accesses OnPrem Viewer                            │
│     http://localhost:3002                                      │
│                                                                 │
│  2. Customer enters license key                                │
│     🔑 License: "FLX-VPI-CO-LTD-20240801-ABC123"              │
│                                                                 │
│  3. OnPrem Agent validates license & fetches data              │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ OnPrem Agent API (Port 3001)                       │    │
│     │ • Validates license key                            │    │
│     │ • Calls Control Plane API for dashboard data      │    │
│     │ • Returns ONLY dashboards allowed by license      │    │
│     └─────────────────────────────────────────────────────┘    │
│                               │                                 │
│  4. OnPrem Viewer displays permitted dashboards                │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ OnPrem Viewer UI (Port 3002)                       │    │
│     │ • Pure display/presentation layer                  │    │
│     │ • No business logic                               │    │
│     │ • Shows only what license permits                 │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Insights:

### 1. **OnPrem Viewer UI**:

- **Role**: Pure presentation layer
- **Logic**: No business logic, just displays data
- **Data Source**: Gets data from OnPrem Agent API

### 2. **OnPrem Agent API**:

- **Role**: Data gateway/proxy
- **Logic**: Validates license, fetches permitted data from Control Plane
- **Security**: Only returns dashboards allowed by license key

### 3. **Control Plane API**:

- **Role**: Data source and authorization authority
- **Logic**: Stores all dashboard data, validates license permissions
- **Access Control**: Firebase API key for admin operations

### 4. **Firebase API Key**:

- **Purpose**: Admin authentication ONLY
- **Usage**: Generate/manage OnPrem licenses
- **Scope**: License management operations, NOT customer data access

### 5. **License Key**:

- **Purpose**: Customer data access control
- **Usage**: Determines which dashboards customer can view
- **Scope**: Customer-facing dashboard access permissions

## 🔄 Data Flow Example:

```
1. Admin Authentication:
   Firebase API Key → Control Plane → Generate License

2. License Creation:
   License Key = {
     tenantId: "vpi-co-ltd",
     dashboardIds: ["sales-dashboard", "analytics-dashboard"],
     features: ["dashboard-viewer"]
   }

3. Customer Access:
   License Key → OnPrem Agent → Control Plane → Dashboard Data

4. UI Display:
   Dashboard Data → OnPrem Viewer → Customer sees permitted dashboards only
```

## 🛡️ Security Model:

- **Admin Level**: Firebase API Key for license management
- **Customer Level**: License Key for data access
- **Data Isolation**: License Key controls which dashboards are accessible
- **Tenant Separation**: Each tenant's Firebase API Key manages their own licenses

This architecture ensures that:

1. Admins can securely manage licenses using Firebase authentication
2. Customers only see dashboards permitted by their license
3. OnPrem deployment is truly lightweight (just UI + data proxy)
4. All business logic and data remain in Control Plane
