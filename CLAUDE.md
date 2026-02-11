# Quran Companion — Ramadan Edition

## Project Overview
A Progressive Web App (PWA) for reading the Quran with audio recitations, translations, bookmarks, and a Ramadan 30-day Khatma plan with auto-tracking.

## Tech Stack
- Vanilla JavaScript (ES6+), HTML5, CSS3 — no build tools
- AlQuran Cloud API (`https://api.alquran.cloud/v1`)
- Service Worker for offline support
- localStorage for persistence (keys prefixed `qc_`)

## File Structure
- `app.js` — All application logic (state, rendering, API, audio, timers, Ramadan tracking)
- `index.html` — HTML structure
- `styles.css` — Complete design system with light/dark themes
- `sw.js` — Service Worker
- `manifest.json` — PWA manifest

## Deployment
- **Auto-deploy**: Pushing to `master` triggers GitHub Actions → GitHub Pages
- **No PRs needed**: Push directly to `master` for deployment
- **Workflow**: `.github/workflows/deploy.yml`

## Development Conventions
- Always push to `master` for deployment (no feature branches needed for small changes)
- Run `node -c app.js` to syntax-check before committing
- All user-facing strings must be in both `en` and `ar` in the `STRINGS` object
- State persists to localStorage — add new keys with `qc_` prefix
- Test both light/dark themes and English/Arabic when changing UI

## Key Architecture
- IIFE pattern wrapping all code in `app.js`
- `state` object holds all app state
- `JUZ_DATA` array maps 30 Juz to surah:verse ranges
- `RAMADAN_DATES` array has Gregorian dates for Ramadan 2025-2030
- Ramadan auto-tracking: reading surahs automatically updates Juz progress
- Milestones at 10, 15, 20, 30 Juz completion
