# Frontend Structure Guide

This frontend is built with:

- React + Vite
- Tailwind CSS (v4)
- Framer Motion
- React Three Fiber (Three.js in React)

## Folder Map

- `src/app/AppRouter.jsx`
  - Main router and page mapping.
- `src/shared/styles/globals.css`
  - Global styles + design tokens (fonts/colors) using CSS variables.
- `src/shared/config/`
  - Central app constants like routes, env settings, and scene theme.
- `src/shared/components/layout/AppHeader.jsx`
  - Top navigation used across pages.
- `src/shared/components/three/HeroScene.jsx`
  - Background 3D scene rendered with Three.js.
- `src/pages/HomePage.jsx`
  - Public home page.
- `src/features/auth/api/auth.api.js`
  - All auth API calls in one file.
- `src/features/auth/components/`
  - Reusable auth UI pieces (`AuthCard`, `AuthField`, `AuthMessage`).
- `src/features/auth/pages/`
  - `RegisterPage.jsx` and `LoginPage.jsx` page logic.

## Why this is scalable

1. Feature-based modules

- Auth code is inside `src/features/auth`, so future features can follow same pattern.

2. Shared layer

- Reusable UI/config files are in `src/shared` to avoid copy-paste.

3. Design tokens

- Fonts and colors are defined in one place (`globals.css`) and referenced by variables.
- This avoids random hardcoded color values everywhere.

## Auth Page Workflows

### Register Page (`/auth/register`)

Three-step flow:

1. Send name + email to start signup OTP.
2. Verify OTP.
3. Set password + confirm password and complete account.

### Login Page (`/auth/login`)

Two login modes:

1. Password mode: email + password.
2. OTP mode: request OTP first, then verify OTP.

## Debug Tips

1. API base URL

- Update `VITE_API_BASE_URL` in `.env` (see `.env.example`).

2. OTP in development

- If backend runs in non-production mode, OTP may appear in API response and server logs.

3. Common errors

- `Network Error`: backend is not running or URL mismatch.
- `401/400`: incorrect credentials or OTP flow order issue.

## Run Commands

From `client/`:

- `npm run dev` for development
- `npm run build` for production build
- `npm run lint` for code quality checks
