# FlexBoard OnPrem Deployment System

## 🔒 Secure OnPremise Dashboard Viewing with License Authentication

FlexBoard OnPrem provides a complete enterprise-grade solution for securely viewing dashboards within your own infrastructure. This system includes license-based authentication, session management, and enterprise security features similar to Windows activation systems.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OnPrem Agent  │    │  License System │    │ OnPrem Viewer   │
│   (Port 3001)   │◄──►│  (Crypto Keys)  │◄──►│   (Port 3002)   │
│                 │    │                 │    │                 │
│ • Data Access   │    │ • Key Generation│    │ • Dashboard UI  │
│ • API Routes    │    │ • Email Auth    │    │ • Session Mgmt  │
│ • Multi-Conn.   │    │ • Session Track │    │ • License Login │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 License System Features

### Windows-Style Activation

- **License Key Format**: `FLX-TENANTID-TIMESTAMP-RANDOM-CHECKSUM`
- **Email Authorization**: Only authorized emails can access dashboards
- **Session Management**: JWT-like session tokens with expiry
- **Concurrent User Limits**: Control simultaneous access
- **Admin Key Protection**: Secure license generation

### Security Features

- ✅ Crypto-based key generation with checksums
- ✅ Email whitelist validation
- ✅ Session expiry and timeout
- ✅ Anti-tampering protection
- ✅ Admin key requirement for license generation
- ✅ Audit logging for all authentication events

## 🚀 Quick Start

### 1. Start the OnPrem System

```bash
# Run the automated test script
./scripts/test-onprem-system.sh
```

### 2. Manual Setup

#### Start OnPrem Agent (Backend)

```bash
cd apps/onprem-agent-api
pnpm install
pnpm build
PORT=3001 pnpm start
```

#### Start OnPrem Viewer (Frontend)

```bash
cd apps/onprem-viewer-ui
pnpm install
pnpm build
PORT=3002 pnpm start
```

### 3. Generate License Key

```bash
curl -X POST http://localhost:3001/api/license/generate \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "admin-secret-key-2024",
    "tenantId": "your-company",
    "companyName": "Your Company Ltd",
    "email": "admin@yourcompany.com",
    "features": ["dashboard-viewer", "data-export"],
    "maxConcurrentUsers": 5,
    "expiryDate": "2025-12-31"
  }'
```

### 4. Access OnPrem Viewer

1. Open http://localhost:3002
2. Enter your license key and authorized email
3. Access your secure dashboards

## 📁 File Structure

```
flexboard/
├── apps/
│   ├── onprem-agent-api/
│   │   ├── src/
│   │   │   ├── license-manager.ts      # Core license management
│   │   │   ├── routes/license.ts       # License API endpoints
│   │   │   └── server-multi-connector.ts
│   │   └── package.json
│   └── onprem-viewer-ui/
│       ├── src/app/
│       │   ├── layout.tsx              # License authentication UI
│       │   └── page.tsx                # Dashboard viewer
│       └── package.json
└── scripts/
    └── test-onprem-system.sh           # Automated testing script
```

## 🔧 API Endpoints

### License Management

- `POST /api/license/generate` - Generate new license key (admin only)
- `POST /api/license/validate` - Validate license and create session
- `POST /api/license/session/validate` - Check session validity
- `POST /api/license/logout` - Terminate session
- `GET /api/license/info` - Get license information

### Example API Usage

#### License Validation

```javascript
const response = await fetch("http://localhost:3001/api/license/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    licenseKey: "FLX-COMPANY-XXXXXXXX-XXXXXXXX-XXXXXXXX",
    email: "user@company.com",
  }),
});
```

#### Session Check

```javascript
const response = await fetch(
  "http://localhost:3001/api/license/session/validate",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "session-uuid-here",
    }),
  }
);
```

## 🛠️ Configuration

### Environment Variables

```bash
# OnPrem Agent
PORT=3001
ADMIN_SECRET_KEY=admin-secret-key-2024
LICENSE_DATA_PATH=./data/licenses
SESSION_DATA_PATH=./data/sessions

# OnPrem Viewer
PORT=3002
NEXT_PUBLIC_AGENT_URL=http://localhost:3001
```

### License Configuration

```typescript
interface LicenseKey {
  licenseKey: string;
  tenantId: string;
  companyName: string;
  email: string;
  features: string[];
  maxConcurrentUsers: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}
```

## 🔐 Security Considerations

### Production Deployment

1. **Change Admin Keys**: Update all default admin keys
2. **HTTPS Only**: Use SSL certificates for production
3. **Firewall Rules**: Restrict access to OnPrem ports
4. **License Storage**: Secure storage for license data files
5. **Session Security**: Configure appropriate session timeouts
6. **Email Validation**: Implement proper email domain restrictions

### License Key Security

- Keys are cryptographically generated with checksums
- Email authorization prevents unauthorized access
- Session tokens expire automatically
- Admin keys required for license generation
- Audit trails for all authentication events

## 📊 Dashboard Features

### OnPrem Viewer Capabilities

- **Multiple Dashboards**: Sales, Customer Analytics, Operations
- **Interactive Widgets**: Charts, metrics, KPIs
- **Real-time Data**: Live connection to OnPrem data sources
- **Responsive Design**: Works on desktop and mobile
- **Session Management**: Automatic logout, session persistence

### Supported Widget Types

- Line Charts (Revenue trends, performance metrics)
- Bar Charts (Growth analysis, comparative data)
- Metrics Cards (KPIs, statistics, percentages)
- Real-time Updates (Live data refresh)

## 🧪 Testing

### Automated Testing

```bash
# Run complete system test
./scripts/test-onprem-system.sh

# Manual license testing
curl -X POST http://localhost:3001/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "YOUR_KEY", "email": "test@company.com"}'
```

### Test Scenarios

1. ✅ License key generation with admin key
2. ✅ License validation with authorized email
3. ✅ Session creation and management
4. ✅ Unauthorized access prevention
5. ✅ Session expiry handling
6. ✅ OnPrem viewer authentication flow

## 🚨 Troubleshooting

### Common Issues

#### License Validation Failed

```bash
# Check if OnPrem Agent is running
curl http://localhost:3001/health

# Verify license key format
echo "Key should match: FLX-TENANTID-TIMESTAMP-RANDOM-CHECKSUM"
```

#### OnPrem Viewer Connection Issues

```bash
# Check if viewer can reach agent
curl http://localhost:3001/api/license/info

# Verify CORS settings in agent
```

#### Session Management Problems

```bash
# Clear browser localStorage
localStorage.removeItem('flexboard_session');

# Check session validity
curl -X POST http://localhost:3001/api/license/session/validate \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "your-session-id"}'
```

## 📈 Production Deployment

### Docker Deployment

```dockerfile
# OnPrem Agent
FROM node:18
COPY apps/onprem-agent-api .
RUN pnpm install && pnpm build
EXPOSE 3001
CMD ["pnpm", "start"]

# OnPrem Viewer
FROM node:18
COPY apps/onprem-viewer-ui .
RUN pnpm install && pnpm build
EXPOSE 3002
CMD ["pnpm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flexboard-onprem
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flexboard-onprem
  template:
    spec:
      containers:
        - name: onprem-agent
          image: flexboard/onprem-agent:latest
          ports:
            - containerPort: 3001
        - name: onprem-viewer
          image: flexboard/onprem-viewer:latest
          ports:
            - containerPort: 3002
```

## 🎯 Enterprise Features

### Advanced Security

- Role-based access control (RBAC)
- Single Sign-On (SSO) integration
- Active Directory authentication
- Audit logging and compliance
- Data encryption at rest and in transit

### Scalability

- Multi-tenant license management
- Load balancing support
- Horizontal scaling capabilities
- Database clustering
- CDN integration for static assets

### Monitoring

- License usage analytics
- Session monitoring dashboard
- Performance metrics
- Health check endpoints
- Alerting and notifications

## 📞 Support

For enterprise support and custom deployments:

- 📧 Email: support@flexboard.com
- 📖 Documentation: https://docs.flexboard.com/onprem
- 🐛 Issues: https://github.com/flexboard/flexboard/issues

---

**🔒 FlexBoard OnPrem - Secure, Scalable, Self-Hosted Dashboard Solution**
