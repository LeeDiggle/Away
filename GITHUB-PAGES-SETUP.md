# Away — GitHub Pages / PWA setup

This update turns Away into an installable web app (PWA) suitable for GitHub Pages.

## Before migrating

1. Open the existing Xcode-installed Away app on the iPhone.
2. Open Settings > Data & backups.
3. Export an Away backup and save the JSON file to iCloud Drive / Files.
4. Do not delete the native Away app until the web version has restored this backup successfully.

## Files added/changed

- `index.html` — PWA and iPhone Home Screen metadata.
- `src/App.tsx` — hash-based routing so every Away screen works reliably on GitHub Pages.
- `src/main.tsx` — service worker registration.
- `public/manifest.webmanifest` — installable app metadata.
- `public/sw.js` — offline app shell/runtime caching.
- `public/icons/*` — Away Home Screen icons.
- `.github/workflows/deploy-pages.yml` — automatic GitHub Pages deployment.
- `.gitignore` — excludes build/native folders.

## Local check

Run:

```bash
npm install
npm run build
npm run dev
```

Open the local URL shown by Vite and check Dashboard, trips, Add Spending, Analysis and Settings.

## GitHub Pages

Create a GitHub repository for Away, push the project to the `main` branch, then in the repository open:

Settings > Pages > Build and deployment > Source > GitHub Actions

The included workflow will build and deploy Away after each push to `main`.

## iPhone

1. Open the GitHub Pages URL in Safari.
2. Tap Share > Add to Home Screen.
3. Open Away from the new Home Screen icon.
4. Open Settings > Data & backups > Restore backup.
5. Select the JSON backup exported from the native version.
6. Confirm the new/upcoming trip and existing transactions are present.
7. Only after this verification should the old Xcode-installed copy be removed.
