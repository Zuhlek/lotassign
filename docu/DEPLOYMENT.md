# Deployment Guide

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main`.

### Setup Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Pages**
   - Under "Build and deployment", select **GitHub Actions** as the source
   - The workflow will run automatically on the next push

3. **Access Your Site**
   - After deployment, your site will be available at:
   - `https://<username>.github.io/<repository-name>/`

### Custom Domain (Optional)

If using a custom domain:

1. Add a `CNAME` file in the `public/` folder with your domain
2. Configure DNS settings with your domain provider
3. Enable "Enforce HTTPS" in GitHub Pages settings

### Deploying to a Subpath

If your repository is not at the root (e.g., `username.github.io/lotassign`):

1. Edit `next.config.mjs`:
   ```javascript
   const nextConfig = {
     output: 'export',
     basePath: '/lotassign',  // Uncomment and set your repo name
     images: { unoptimized: true },
     trailingSlash: true,
   };
   ```

2. Commit and push the changes

## Manual Deployment

### Build Locally

```bash
# Install dependencies
npm install

# Build static export
npm run export

# The /out folder contains the static site
```

### Deploy to Other Platforms

The `/out` folder can be deployed to any static hosting:

- **Netlify**: Drag and drop `/out` folder
- **Vercel**: Connect repo (works automatically)
- **AWS S3**: Upload `/out` contents to bucket
- **Cloudflare Pages**: Connect repo or upload folder

## Troubleshooting

### 404 on Page Refresh

This is expected behavior for client-side routing on static hosts. The `trailingSlash: true` config helps mitigate this by generating `page/index.html` instead of `page.html`.

### Blank Page After Deployment

Check browser console for errors. Common issues:
- Missing `basePath` configuration if not at domain root
- CORS issues with external resources

### Build Fails

1. Ensure all dependencies are installed: `npm ci`
2. Check for TypeScript errors: `npm run lint`
3. Verify no server-side features are used (API routes, etc.)

## CI/CD Pipeline Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Triggers**: Push to `main` or manual dispatch
2. **Build Job**:
   - Checks out code
   - Sets up Node.js 20
   - Installs dependencies with `npm ci`
   - Builds static export with `npm run build`
   - Adds `.nojekyll` file (prevents Jekyll processing)
   - Uploads artifact for deployment
3. **Deploy Job**:
   - Deploys to GitHub Pages environment
   - Outputs the deployed URL
