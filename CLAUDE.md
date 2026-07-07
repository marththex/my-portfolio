# CLAUDE.md — Portfolio onboarding

## Project overview

Personal portfolio site for Marcus Chong, Software Engineer — Artificial Intelligence at Boeing. Built with Astro 6 in server-output mode, self-hosted on a NAS via Docker and Nginx Proxy Manager with a Cloudflare tunnel for remote SSH deploys. The site presents Marcus's bio, patents & awards, work experience, education, and colleague testimonials through a single-page layout.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Astro 6.x (`output: 'server'`, `@astrojs/node` standalone adapter) |
| Language | TypeScript 5 — strict mode (`astro/tsconfigs/strict`) |
| Styling | Scoped `<style>` blocks per component + CSS custom properties in `global.css` |
| Fonts | Syne (display), Instrument Serif (body), DM Mono (mono) — Google Fonts |
| Testing | Vitest 3 (smoke tests only) |
| Linting | ESLint 9 flat config (`eslint.config.js`) |
| Container | Docker multi-stage → `node:22-alpine` running the Astro server |
| Reverse proxy | Nginx Proxy Manager + Cloudflare tunnel |

## Directory structure

```
my-portfolio/
├── src/
│   ├── components/         # One .astro file per section (Hero, About, Recognition, Experience, Education, Testimonials, Contact)
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
├── public/                 # Static assets (favicons, profile photo, robots.txt, sitemap.xml)
├── .github/workflows/
│   ├── ci.yml              # CI: lint → typecheck → build → test → audit (PR + push to main)
│   └── deploy.yml          # CD: build + SSH deploy to NAS via Cloudflare tunnel (push to main)
├── astro.config.mjs        # Astro config — server output, node adapter, site URL
├── eslint.config.js        # ESLint 9 flat config
├── Dockerfile              # Multi-stage: Node build → node:22-alpine runs dist/server/entry.mjs
├── docker-compose.yml      # NAS deployment config
└── nginx.conf              # Legacy — not referenced by Dockerfile or compose (proxying is handled by Nginx Proxy Manager)
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
- **Breakpoints**: `768px` is the global mobile breakpoint (nav, footer, container padding in `global.css`); `Hero.astro` stacks to a single column at `900px`. On mobile the hero must not rely on `100vh` + `justify-content: center` — the stacked content is taller than the viewport, and flex centering pushes the overflow above the scroll origin where it can't be scrolled to (clipping the image/badge under the fixed nav). The mobile media query uses `justify-content: flex-start` with explicit top padding instead.
- **Scrolling**: the document never scrolls — `html`/`body` are locked at viewport height and all scrolling happens in the `.page-scroll` container in `BaseLayout.astro`. This is deliberate: iOS Safari paints document-scrolled content into the status-bar strip above the viewport, where no fixed element, padding, or `env(safe-area-inset-top)` can mask it (it's 0 in portrait browsing). With the document locked, the strip only ever shows the page background. Consequences: scroll listeners must attach to `#pageScroll` and read `scrollTop` (not `window.scrollY`), and `scroll-behavior: smooth` lives on the container. A `theme-color` meta keeps Safari's chrome matched to `--bg`.
- **Path aliases**: `@components/*`, `@layouts/*`, `@styles/*` are configured in `tsconfig.json`.
- **Output mode**: `server` (not `static`) because of the `/api/contact` route. The `@astrojs/node` standalone adapter generates a Node.js server in `dist/`. The homepage itself is prerendered (`export const prerender = true` in `index.astro`); only the API route is server-rendered.
- **Contact API security**: Astro's origin check is enabled (the default), so form-content POSTs without a matching `Origin` header get a 403 — curl tests against `/api/contact` must send `-H "Origin: <site url>"`. The route additionally rate-limits per IP (5 per 10 min), short-circuits on the hidden `website` honeypot field, escapes all user input before interpolating into email HTML, and never echoes user content back to the sender-supplied address. Don't relax any of these — the confirmation email goes to an address the requester controls.
- **SEO files**: `public/sitemap.xml` and `public/robots.txt` are hand-maintained — update `sitemap.xml` if pages are ever added. Privacy rule: no email address, phone number, or resume PDF on the site; all contact goes through the form.

## CI/CD overview

**CI** (`.github/workflows/ci.yml`) runs on every PR and push to `main`. Stages: ESLint → `tsc --noEmit` → `astro build` → Vitest smoke tests → `npm audit` (warn-only, non-blocking). Node 22, with `node_modules` cached by lock file hash.

**CD** (`.github/workflows/deploy.yml`) triggers on push to `main`. It builds the project, then SSHes into the NAS via a Cloudflare Access TCP tunnel (`ssh.marcuslchong.com`), runs `git pull` + `docker compose up -d --build`, and prunes old images. Deployment target: self-hosted NAS at `marcuslchong.com`.

## Working with Claude

- **Add a new section**: "Create a new `src/components/<Name>.astro` following the pattern of `Experience.astro` or `Recognition.astro`. Add its data array to `index.astro` frontmatter and, if it should be navigable, add links in `BaseLayout.astro` (desktop nav + mobile menu)."
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
