# GitHub to Bitbucket Mirror Setup

This document explains how to set up automatic mirroring from GitHub to Bitbucket for the Flexboard project.

## 🔄 How it Works

The GitHub Action automatically mirrors code from GitHub to Bitbucket whenever you push to:

- `main` branch → triggers Bitbucket Pipelines for **PRODUCTION** deployment
- `dev` branch → triggers Bitbucket Pipelines for **SANDBOX** deployment

## 🔑 Required GitHub Secrets

You need to set these secrets in your GitHub repository:

### 1. Go to GitHub Repository Settings

Navigate to: `Settings > Secrets and variables > Actions`

### 2. Add Repository Secrets

#### `BB_USERNAME`

- Your Bitbucket username (e.g., `your-bitbucket-username`)

#### `BB_APP_PASSWORD`

- Bitbucket App Password (NOT your regular password)

### 3. Creating Bitbucket App Password

1. Go to Bitbucket → **Personal Settings** → **App passwords**
2. Click **Create app password**
3. Give it a name: `GitHub Mirror`
4. Select permissions:
   - **Repositories**: Write
   - **Pull requests**: Write (optional)
5. Copy the generated password

## 📋 Workflow Configuration

Current workflow (`/.github/workflows/mirror-full-repo.yml`):

```yaml
name: Mirror dev & main to Bitbucket

on:
  push:
    branches: [main, dev]

jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Add Bitbucket remote
        run: |
          git remote add bitbucket https://${{ secrets.BB_USERNAME }}:${{ secrets.BB_APP_PASSWORD }}@bitbucket.org/digitalvalueth/flexboard.git

      - name: Push same branch to Bitbucket
        run: |
          git push bitbucket ${{ github.ref_name }}:${{ github.ref_name }} --follow-tags
```

In your GitHub repository, go to `Settings > Secrets and variables > Actions`:

#### Repository Secrets:

```
BB_USERNAME=your-bitbucket-username
BB_APP_PASSWORD=your-app-password-from-step-2
```

### 4. Update Bitbucket Repository URL

Edit `.github/workflows/mirror-full-repo.yml` line 60:

```yaml
BB_REPO="bitbucket.org/YOUR_WORKSPACE/YOUR_REPO_NAME.git"
```

Replace:

- `YOUR_WORKSPACE`: Your Bitbucket workspace name
- `YOUR_REPO_NAME`: Your Bitbucket repository name

## 🚀 How It Works

### Automatic Triggers

- Push to `main` branch → Mirror to Bitbucket → Trigger production deployment
- Push to `dev` branch → Mirror to Bitbucket → Trigger sandbox deployment

### Manual Trigger

You can manually trigger the mirror via GitHub Actions:

1. Go to Actions tab
2. Select "Mirror Full Repo → Bitbucket"
3. Click "Run workflow"
4. Optionally enable "Force push" for conflicts

## 📋 Workflow Files

- `mirror-full-repo.yml`: Mirrors entire repository to Bitbucket
- `mirror-to-bitbucket.yml`: Mirrors only onprem-viewer (existing)

## 🔍 Monitoring

### GitHub Actions

Check the Actions tab to see mirror status:

- ✅ Green: Successfully mirrored
- ❌ Red: Check logs for errors

### Bitbucket Pipelines

After successful mirror:

1. Go to your Bitbucket repository
2. Check Pipelines tab
3. Should see automatic pipeline execution

## 🛠️ Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check BB_USERNAME and BB_APP_PASSWORD secrets
   - Verify app password permissions
   - Ensure Bitbucket repository exists

2. **"Remote already exists"**
   - Workflow handles this automatically
   - Should not be an issue

3. **"Push conflicts"**
   - Use manual trigger with "Force push" enabled
   - Or resolve conflicts in Bitbucket first

4. **"Repository not found"**
   - Check Bitbucket repository URL in workflow
   - Verify repository exists and is accessible

### Debug Steps

1. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand step logs

2. **Verify Bitbucket access**:

   ```bash
   # Test locally (replace with your credentials)
   git clone https://username:app_password@bitbucket.org/workspace/repo.git
   ```

3. **Check Bitbucket repository**:
   - Ensure repository exists
   - Check if branches are updated
   - Verify commit history

## 🎯 Deployment Flow

```mermaid
graph LR
    A[GitHub Push] --> B[GitHub Actions]
    B --> C[Mirror to Bitbucket]
    C --> D[Bitbucket Pipelines]
    D --> E[GCP Cloud Run]
```

1. Developer pushes to GitHub (`main` or `dev`)
2. GitHub Actions triggers mirror workflow
3. Code is synced to Bitbucket repository
4. Bitbucket Pipelines automatically starts
5. Applications deployed to Google Cloud Run

## 📝 Best Practices

1. **Always test in `dev` first** before merging to `main`
2. **Monitor both GitHub and Bitbucket** for any sync issues
3. **Keep app passwords secure** and rotate regularly
4. **Use descriptive commit messages** for better tracking

## 🔗 Related Documentation

- [Bitbucket Pipelines Deployment Guide](./BITBUCKET_PIPELINES_DEPLOYMENT.md)
- [Bitbucket App Passwords Documentation](https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
