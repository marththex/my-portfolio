# Marcus Chong — Portfolio

Personal portfolio for Marcus Chong, Software Engineer — Artificial Intelligence at Boeing.

🌐 **[marcuslchong.com](https://marcuslchong.com)**

---

![CI](https://github.com/marththex/my-portfolio/actions/workflows/ci.yml/badge.svg)
![Astro](https://img.shields.io/badge/Astro-6.x-FF5D01?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-container-2496ED?logo=docker&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev        # http://localhost:4321

# 3. Build for production
npm run build
```

Requires Node.js ≥ 22.12.0.

The contact form needs a [Resend](https://resend.com) key: copy `.env.example` to `.env` and set `RESEND_API_KEY`.

---

## Project structure

```
src/
├── components/          # Hero, About, Recognition, Experience, Education, Testimonials, Contact
├── data/
│   └── testimonials.ts  # Testimonial entries — single source of truth
├── layouts/
│   └── BaseLayout.astro # Global head, nav, footer
├── pages/
│   ├── index.astro      # All site content lives here — edit this file
│   └── api/contact.ts   # Contact form API route (Resend)
├── styles/
│   └── global.css       # Design tokens (CSS custom properties)
└── tests/
    └── smoke.test.ts    # Vitest smoke tests
```

**Content changes** → edit `src/pages/index.astro` frontmatter.
**Testimonials** → edit `src/data/testimonials.ts`.

---

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`:

| Step | Command |
|---|---|
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Smoke test | `npm test` |
| Audit | `npm audit --audit-level=high` (warn only) |

---

## Deployment

CD is handled by `.github/workflows/deploy.yml`. On push to `main` it SSHes into the NAS via a Cloudflare Access tunnel, pulls latest, and runs `docker compose up -d --build`. The container serves the Node.js server behind Nginx Proxy Manager with a Let's Encrypt certificate at `marcuslchong.com`.

Manual redeploy:

```bash
docker compose up -d --build
```

---

## License

Personal portfolio — all rights reserved.
