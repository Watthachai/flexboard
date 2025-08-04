# FlexBoard Complete Flow - The Real Architecture

## 🏗️ Complete Development & Deployment Flow

### Step 1: Development Team Creates Tenant

```
Control Plane UI → Create Tenant
├─ id: "vpi-co-ltd"
├─ name: "VPI co.ltd"
├─ apiKey: "tenant-1753950967508-84yme8k73" ← 🔑 OnPrem Connection Key
├─ config: { theme, refreshInterval, etc. }
└─ dashboards: [dashboard configurations]
```

### Step 2: Create Dashboards for Tenant

```
Control Plane UI → Dashboard Management
├─ Create "Sales Dashboard" for vpi-co-ltd
├─ Create "Analytics Dashboard" for vpi-co-ltd
├─ Configure data sources, widgets, charts
└─ All stored in Control Plane (Firebase/Database)
```

### Step 3: Package OnPrem Deployment

```
📦 OnPrem Package for Customer:
├─ onprem-agent-api/ (Port 3001)
│   ├─ Pre-configured with tenant API key
│   ├─ Points to Control Plane API
│   └─ config.json: { controlPlaneUrl, tenantApiKey }
│
├─ onprem-viewer-ui/ (Port 3002)
│   ├─ Login interface
│   ├─ Dashboard display
│   └─ Points to local OnPrem Agent
│
└─ Installation Instructions
```

### Step 4: Customer Installation

```
Customer Environment:
├─ Install onprem-agent-api with tenant API key
├─ Install onprem-viewer-ui
├─ Customer gets license key from development team
└─ Customer can access their permitted dashboards
```

## 🔑 API Key Real Purpose

### **Firebase Tenant API Key = OnPrem → Control Plane Authentication**

```javascript
// onprem-agent-api/config.json
{
  "controlPlaneApiUrl": "https://your-control-plane.com",
  "tenantApiKey": "tenant-1753950967508-84yme8k73",
  "tenantId": "vpi-co-ltd"
}

// When OnPrem Agent calls Control Plane:
fetch('https://control-plane/api/dashboards/sales-dashboard', {
  headers: {
    'Authorization': `Bearer tenant-1753950967508-84yme8k73`,
    'X-Tenant-ID': 'vpi-co-ltd'
  }
})
```

## 🔄 Complete Data Flow

### **Development Phase** (Your Team):

```
1. Create Tenant in Control Plane UI
   ↓
2. Generate API Key for that tenant
   ↓
3. Create dashboards and configure data
   ↓
4. Package OnPrem with tenant API key
   ↓
5. Generate license keys for customer access
```

### **Customer Installation** (Customer Environment):

```
1. Install OnPrem package (with embedded tenant API key)
   ↓
2. OnPrem Agent connects to Control Plane using tenant API key
   ↓
3. Customer enters license key to access specific dashboards
   ↓
4. OnPrem Agent fetches only permitted dashboard data
```

## 🎯 Who Uses What

### **Development Team (You)**:

- **Control Plane UI**: Create tenants, dashboards, licenses
- **Firebase Console**: Manage tenant configurations
- **Admin Access**: Full access to everything

### **Customer End Users**:

- **License Key**: Access specific dashboards
- **OnPrem Viewer**: View permitted data only
- **No Admin Access**: Cannot create/modify dashboards

### **OnPrem System**:

- **Tenant API Key**: Authenticate with Control Plane
- **License Validation**: Control which dashboards to show
- **Data Proxy**: Fetch and display permitted data

## 🔧 Configuration Files

### OnPrem Agent Configuration:

```json
{
  "tenant": {
    "id": "vpi-co-ltd",
    "apiKey": "tenant-1753950967508-84yme8k73",
    "name": "VPI co.ltd"
  },
  "controlPlane": {
    "apiUrl": "https://flexboard-control-plane.com",
    "timeout": 30000
  },
  "server": {
    "port": 3001,
    "cors": {
      "origin": "http://localhost:3002"
    }
  }
}
```

### License Key Structure:

```json
{
  "licenseKey": "<LICENSE_KEY_EXAMPLE>",
  "tenantId": "vpi-co-ltd",
  "permissions": {
    "dashboardIds": ["sales-dashboard", "analytics-dashboard"],
    "features": ["dashboard-viewer", "data-export"],
    "maxUsers": 5,
    "expiryDate": "2025-12-31"
  }
}
```

## 🚀 Deployment Scenarios

### Scenario 1: SaaS Customer (Simple)

```
Customer → Direct Control Plane UI Access
No OnPrem needed
```

### Scenario 2: OnPrem Customer (Complex)

```
Customer Environment:
├─ OnPrem Agent (with tenant API key)
├─ OnPrem Viewer UI
├─ License keys for end users
└─ All data fetched from Control Plane
```

## 💡 Key Insights

1. **API Key**: OnPrem ↔ Control Plane authentication
2. **License Key**: User ↔ Dashboard access control
3. **Tenant Isolation**: Each customer gets their own API key
4. **Data Source**: Always Control Plane (even for OnPrem)
5. **OnPrem Role**: Display layer + data proxy only

This architecture allows:

- **You**: Manage everything centrally
- **Customer**: Install lightweight OnPrem package
- **End Users**: Access only permitted dashboards
- **Security**: Proper tenant isolation and access control
