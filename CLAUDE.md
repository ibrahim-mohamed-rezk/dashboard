# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000, redirects to /ar)
npm run build    # Production build (type-checks the whole project)
npm run start    # Serve the production build
npm run lint     # next lint (eslint-config-next)
```

There is no test runner configured — `next lint` and `npm run build` (full TS type-check via `tsconfig`) are the only automated checks.

## Big Picture

This is a Next.js 15 **App Router** admin dashboard (the "dash-tail" template) for an Arabic e-learning platform. It is a pure frontend: it talks to an external Laravel backend at `https://safezone-co.top/api/v1/dashboard/` and uses its own Next API routes only for auth-cookie plumbing. React 19 + TypeScript (strict). UI is Tailwind + Radix primitives in `components/ui`. Path alias `@/*` maps to the repo root.

### Routing & i18n

- Every route is nested under `app/[lang]/`. `middleware.ts` redirects any locale-less path to a locale prefix; **`ar` is the only active locale** (`defaultLocale = "ar"`, `locales = ["ar"]`), so the app is RTL Arabic. Server-side dictionaries live in `app/dictionaries/` (loaded via `app/dictionaries.ts`, `server-only`).
- Authenticated screens live in the `app/[lang]/(dashboard)/` route group; auth screens (login/register/forgot/lock/verify) live in `app/[lang]/auth/`. Each top-level dashboard folder (`students`, `courses`, `teachers`, `exams`, `banks`, etc.) is one feature page.

### Authentication & the localStorage/cookie split (critical)

This is the single most important architectural quirk — read before touching auth or any data-fetching page.

The Laravel backend returns a large user object (nested `teachers`, `modules`) that **exceeds the 4KB browser cookie limit**, which silently breaks `Set-Cookie`. The fix (see `COOKIE_SIZE_FIX_README.md`, `DYNAMIC_ROUTES_FIX_COMPLETE.md`):

- **Only the bearer `token` is stored in an httpOnly cookie**, written via `POST /api/auth/setToken` and read via `GET /api/auth/getToken` (`app/api/auth/`).
- **The full user object is stored in `localStorage` under `"user"`** (and the Zustand `auth-storage` key, see `store/useAuthStore.ts`). It is *not* in any cookie.
- **Consequence: pages that need the user object MUST be client components** (`"use client"`). A server component reading `cookies().get("user")` will get nothing and wrongly deny access. When adding/editing a feature page, fetch the token from `/api/auth/getToken` and read `user` from `localStorage` in a `useEffect` — mirror `app/[lang]/(dashboard)/students/page.tsx`.
- The `(dashboard)/layout.tsx` server component still gates on the *token* cookie alone (redirects to `/auth/login` if absent) — that's fine because it never needs the user object.

Note `lib/auth.ts` (NextAuth `authOptions` with Google/Github/Credentials) exists but the real login flow uses the Laravel backend + the token-cookie mechanism above; NextAuth is largely vestigial template code.

### Module-based authorization

Access control is **module-driven, not role-driven**. The backend attaches a `modules: [{ name, path, access }]` array to the user. Gate features with `canAccessModule(user.modules, "students")` from `lib/permissions.ts` (case-insensitive, matches `name` or `path`, and coerces `access` from bool/number/string). The `useAuthrization({ user, module })` hook (`hooks/useAuthrization.ts`) wraps it. Standard page pattern: compute `isAuthrized` and early-return an Arabic "no permission" message if false. Some UI also branches on `user.role` (e.g. `"admin"` sees a teacher filter), but **the source of truth for page access is modules**. Module checks are intentionally enforced in pages/hooks, not in middleware.

### Data fetching

- Backend calls go through `lib/axios/server.ts` — `getData`/`postData`/`deleteData` helpers wrapping an axios instance pointed at the Laravel base URL. Default `Content-Type` is `multipart/form-data`. Always pass `{ Authorization: \`Bearer ${token}\` }` in the headers arg.
- **Updates use `postData` with a `_method: "PUT"` field in `FormData`** (Laravel method spoofing), not a real PUT.
- `config/axios.config.ts` (`api`) is a separate instance for calling this app's own `/api` routes.
- Feature pages are heavy client components that manage their own state: server-side pagination (`manualPagination` with `@tanstack/react-table`), filter objects, modals defined inline, and Excel export via `xlsx`. Toasts use `react-hot-toast` with Arabic strings.

### State & providers

- Global state: Zustand (`store/useAuthStore.ts` for auth, `useThemeStore` for theme/radius) plus Redux Toolkit (`store/slices/`, wired through `store/ReduxProvider.tsx`). Provider tree is assembled in `provider/` and `app/[lang]/layout.tsx`.
- Theme/RTL/layout providers live in `provider/` (`providers.client.tsx`, `dashboard.layout.*`, `direction.provider.tsx`).

## Conventions

- **UI text is Arabic** and the layout is RTL — keep new user-facing strings Arabic to match.
- SVG imports become React components via `@svgr/webpack` (configured in `next.config.js`); use `import Icon from "./x.svg"`, or `?url` suffix for a URL.
- Remote image hosts must be whitelisted in `next.config.js` `images.remotePatterns` before `next/image` will load them.
- Env vars (`.env.local`): `AUTH_SECRET`, `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_ENDPOINT`.
- The repo root holds several `*_FIX_*.md` / `MIGRATION_*.md` notes documenting past refactors (cookie size, dynamic-route auth, pages migration) — consult them when working on auth or migrations.
