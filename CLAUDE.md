# CLAUDE.md — Portfolio onboarding

## Project overview

Personal portfolio site for Marcus Chong, Software Engineer — Artificial Intelligence at Boeing. Built with Astro 6 in server-output mode, self-hosted on a NAS via Docker and Nginx Proxy Manager with a Cloudflare tunnel for remote SSH deploys. The site presents Marcus's bio, work experience, and colleague testimonials through a single-page layout.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Astro 6.x (`output: 'server'`, `@astrojs/node` standalone adapter) |
| Language | TypeScript 5 — strict mode (`astro/tsconfigs/strict`) |
| Styling | Scoped `<style>` blocks per component + CSS custom properties in `global.css` |
| Fonts | Syne (display), Instrument Serif (body), DM Mono (mono) — Google Fonts |
| Testing | Vitest 3 (smoke tests only) |
| Linting | ESLint 9 flat config (`eslint.config.js`) |
| Container | Docker multi-stage → `nginx:alpine` |
| Reverse proxy | Nginx Proxy Manager + Cloudflare tunnel |

## Directory structure

```
my-portfolio/
├── src/
│   ├── components/         # One .astro file per section (Hero, About, Experience, Testimonials, Contact)
│   ├── data/
│   │   └── testimonials.ts # Testimonial data — single source of truth, imported by component + tests
│   ├── layouts/
│   │   └── BaseLayout.astro # Global <head>, nav, footer
│   ├── pages/
│   │   ├── index.astro     # All site content lives here (personal, bio, skills, experience)
│   │   └── api/
│   │       └── contact.ts  # Contact form API route (Resend email)
│   ├── styles/
│   │   └── global.css      # Design system: CSS variables, fonts, base reset
│   └── tests/
│       └── smoke.test.ts   # Vitest smoke tests for data integrity
├── public/                 # Static assets (favicon, profile photo)
├── .github/workflows/
│   ├── ci.yml              # CI: lint → typecheck → build → test → audit (PR + push to main)
│   └── deploy.yml          # CD: build + SSH deploy to NAS via Cloudflare tunnel (push to main)
├── astro.config.mjs        # Astro config — server output, node adapter, CSRF disabled for API
├── eslint.config.js        # ESLint 9 flat config
├── Dockerfile              # Multi-stage: Node build → nginx:alpine serve
├── docker-compose.yml      # NAS deployment config
└── nginx.conf              # Static file serving config
```

## Dev commands

```bash
npm install          # Install all dependencies (includes optional native deps)
npm run dev          # Dev server at http://localhost:4321
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (TypeScript strict check)
npm test             # Vitest smoke tests (non-watch)
npm run build        # Production build → dist/
npm run preview      # Serve production build locally
```

## Key conventions

- **All site content** (name, bio, skills, experience) lives in the `---` frontmatter of `src/pages/index.astro`. Edit that file, not the components, for content changes.
- **Testimonial data** is the exception — it lives in `src/data/testimonials.ts` so it can be imported by both the component and the test suite.
- **Component props** are typed inline via Astro's `interface Props {}` block, not in separate `.d.ts` files.
- **Styling**: no Tailwind, no CSS modules. Each component uses a scoped `<style>` block. Shared design tokens (colors, fonts, spacing) are CSS custom properties on `:root` in `global.css`. Swap `--accent` in `global.css` to retheme the entire site.
- **Breakpoints**: `768px` is the global mobile breakpoint (nav, footer, container padding in `global.css`); `Hero.astro` stacks to a single column at `900px`. On mobile the hero must not rely on `100vh` + `justify-content: center` — the stacked content is taller than the viewport, and flex centering pushes the overflow above the scroll origin where it can't be scrolled to (clipping the image/badge under the fixed nav). The mobile media query uses `justify-content: flex-start` with explicit top padding (plus `env(safe-area-inset-top)` for notched phones) instead.
- **Path aliases**: `@components/*`, `@layouts/*`, `@styles/*` are configured in `tsconfig.json`.
- **Output mode**: `server` (not `static`) because of the `/api/contact` route. The `@astrojs/node` standalone adapter generates a Node.js server in `dist/`.
- **CSRF**: disabled in `astro.config.mjs` (`checkOrigin: false`) — the contact API handles its own validation.

## CI/CD overview

**CI** (`.github/workflows/ci.yml`) runs on every PR and push to `main`. Stages: ESLint → `tsc --noEmit` → `astro build` → Vitest smoke tests → `npm audit` (warn-only, non-blocking). Node 22, with `node_modules` cached by lock file hash.

**CD** (`.github/workflows/deploy.yml`) triggers on push to `main`. It builds the project, then SSHes into the NAS via a Cloudflare Access TCP tunnel (`ssh.marcuslchong.com`), runs `git pull` + `docker compose up -d --build`, and prunes old images. Deployment target: self-hosted NAS at `marcuslchong.com`.

## Working with Claude

- **Add a new section** (e.g. Projects): "Create a new `src/components/Projects.astro` section following the same pattern as `Experience.astro`. Add a `projects` data array to `index.astro` frontmatter with fields: title, description, tech, url."
- **Update testimonials**: "Edit `src/data/testimonials.ts` — add/remove/update entries. Do not touch `Testimonials.astro` unless the card layout needs to change."
- **Modify the CI workflow**: "Update `.github/workflows/ci.yml` to [add a step / change the Node version / make audit blocking]."
- **Update the README**: "Refresh `README.md` — the live URL is `https://marcuslchong.com`, the repo is `marththex/my-portfolio`."
- **Retheme the site**: "Change the accent color — update `--accent` in `src/styles/global.css`."

## Out of scope — do not touch without explicit instruction

- `.github/workflows/deploy.yml` — modifying the CD pipeline risks breaking live deploys
- `Dockerfile` and `docker-compose.yml` — container config is stable; changes affect the hosted instance
- `package-lock.json` — do not manually edit; let `npm install` manage it
- `dist/` — generated build output, never committed
- `.astro/` — generated Astro type cache, never committed
