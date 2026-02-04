# Deploy to Cloudflare Pages

Use these settings in the Cloudflare Pages dashboard so the build finds the project and output.

## Fix "Root directory not found"

If you see **Root directory not found** (or the build fails to find the project):

1. In your Pages project: **Settings** → **Builds & deployments** → **Build configuration**.
2. Set **Root directory** to **empty** (leave the field blank).
   - The repo root is where `package.json` and `astro.config.mjs` live. Do **not** set a subfolder (e.g. `website` or `app`) unless your app really lives in one.
3. Save and trigger a new deployment.

## Build configuration

| Setting | Value |
|--------|--------|
| **Framework preset** | None (or Astro if listed) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | *(leave empty)* |
| **Environment variables** | Add any needed (e.g. Node version) |

## Node version (optional)

If the build fails on Node, set an environment variable:

- **Variable:** `NODE_VERSION`  
- **Value:** `20` (or `18`)

(Under **Settings** → **Environment variables** for the Production and/or Preview environment.)

## Summary

- **Root directory** = blank → build runs from repo root.
- **Build output directory** = `dist` → Astro’s default output.
- **Build command** = `npm run build`.

After saving, run **Retry deployment** (or push a new commit) to redeploy.
