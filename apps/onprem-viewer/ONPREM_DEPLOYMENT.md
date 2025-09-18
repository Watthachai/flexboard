# FlexBoard OnPrem Deployment Guide

This guide helps you deploy FlexBoard OnPrem for local network access.

## 🎯 Overview

FlexBoard OnPrem allows you to:

- Run the dashboard server on one machine (Server)
- Access dashboards from other computers in the network via IP address
- Automatically sync XML data every 5 minutes from local file system
- No cloud database required - everything runs locally

## 📋 Architecture

```
┌─────────────────────────────────────────────────┐
│                 Customer Network                │
│                                                 │
│  ┌─────────────┐    ┌─────────────────────────┐  │
│  │ Server      │    │ Client PCs              │  │
│  │ 192.168.1.10│◄───┤ 192.168.1.11, 12, 13..│  │
│  │             │    │                         │  │
│  │ • OnPrem    │    │ • Web Browser           │  │
│  │   Viewer    │    │ • Access via            │  │
│  │ • XML Files │    │   192.168.1.10:3002    │  │
│  │ • Database  │    │                         │  │
│  └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd flexboard/apps/onprem-viewer
npm install
```

### 2. Run Setup Script

```bash
npm run setup:onprem
```

This will:

- Create XML data directory
- Generate `.env.local` file
- Show network IP addresses
- Display firewall instructions

### 3. Configure License

Edit `.env.local` file:

```bash
# Update these values
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_API_KEY=your-license-key
```

### 4. Add XML Files

Copy your XML data files to the XML directory:

**Windows:**

```bash
copy your-xml-files C:\flexboard\xml-data\
```

**Linux/macOS:**

```bash
cp your-xml-files/* /opt/flexboard/xml-data/
```

### 5. Build and Start

```bash
npm run build
npm run start:onprem
```

### 6. Configure Firewall

**Windows (Run as Administrator):**

```bash
netsh advfirewall firewall add rule name="FlexBoard OnPrem" dir=in action=allow protocol=TCP localport=3002
```

**Ubuntu/Debian:**

```bash
sudo ufw allow 3002
```

**CentOS/RHEL:**

```bash
sudo firewall-cmd --add-port=3002/tcp --permanent
sudo firewall-cmd --reload
```

## 🌐 Network Access

After setup, the dashboard will be accessible at:

- **Server**: `http://localhost:3002`
- **Network**: `http://192.168.x.x:3002` (replace with actual server IP)

## 📁 XML File Management

### Automatic Sync

- XML files are checked every 5 minutes
- Latest file (by modification time) is used
- Dashboard data updates automatically

### File Requirements

- Place XML files in the configured directory
- Supported format: Standard XML files
- File naming: Any `.xml` extension

### Manual Sync

You can force a manual sync via the OnPrem Status widget or API:

```bash
curl -X POST http://localhost:3002/api/xml-data \
  -H "Content-Type: application/json" \
  -d '{"action": "force-sync"}'
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NODE_ENV=production
HOSTNAME=0.0.0.0          # Allow network access
PORT=3002                 # Server port
XML_DATA_PATH=/opt/flexboard/xml-data  # XML files location

# License
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_API_KEY=your-license-key

# App Configuration
NEXT_PUBLIC_APP_NAME=FlexBoard OnPrem Viewer
NEXT_PUBLIC_ENVIRONMENT=production
```

### Network Configuration

The server binds to `0.0.0.0:3002` to allow access from any IP in the network.

### XML Path Configuration

**Platform-specific defaults:**

- Windows: `C:\flexboard\xml-data`
- Linux/macOS: `/opt/flexboard/xml-data`

Override with `XML_DATA_PATH` environment variable.

## 📊 Monitoring

### OnPrem Status Widget

The dashboard includes a status widget showing:

- Sync service status (running/stopped)
- Last sync time
- Data record count
- Next sync countdown
- XML directory status
- Available XML files

### API Endpoints

**Get Data:**

```bash
GET /api/xml-data
```

**Force Sync:**

```bash
POST /api/xml-data
Content-Type: application/json
{"action": "force-sync"}
```

**Get Status:**

```bash
POST /api/xml-data
Content-Type: application/json
{"action": "status"}
```

## 🔍 Troubleshooting

### Common Issues

**1. Cannot access from other computers**

- Check firewall configuration
- Verify server is listening on `0.0.0.0:3002`
- Ensure computers are on same network

**2. No data showing**

- Check XML files exist in configured directory
- Verify XML files are valid format
- Check OnPrem Status widget for sync errors

**3. Sync not working**

- Check file permissions on XML directory
- Verify XML files are readable
- Review server logs for errors

### Debug Mode

Enable debug logging:

```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

### Logs Location

Server logs are printed to console. For production deployment, redirect to file:

```bash
npm run start:onprem > onprem.log 2>&1
```

## 🎯 Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start "npm run start:onprem" --name "flexboard-onprem"

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/flexboard-onprem.service`:

```ini
[Unit]
Description=FlexBoard OnPrem Viewer
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/flexboard/apps/onprem-viewer
ExecStart=/usr/bin/npm run start:onprem
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable flexboard-onprem
sudo systemctl start flexboard-onprem
```

## 📋 Maintenance

### Regular Tasks

1. **Monitor XML files**: Ensure latest data is available
2. **Check disk space**: XML files and logs
3. **Review logs**: Monitor for errors
4. **Update license**: Before expiration

### Backup

Important files to backup:

- `.env.local` (license configuration)
- XML data directory
- Dashboard configurations

### Updates

To update the application:

1. Stop the service
2. Pull latest code
3. Run `npm install`
4. Run `npm run build`
5. Start the service

## 🔐 Security

### Network Security

- OnPrem runs on local network only
- No external internet access required
- All data stays within customer network

### Access Control

- License key authentication
- No user authentication required for viewers
- Consider network-level access controls if needed

## 📞 Support

For issues or questions:

1. Check OnPrem Status widget
2. Review server logs
3. Verify network configuration
4. Contact support with logs and error details
