# Marcus Chong — Personal Portfolio

Personal portfolio website for Marcus Chong, Software Engineer — Artificial Intelligence at Boeing. Built with Astro and TypeScript, self-hosted on a NAS via Docker and Nginx Proxy Manager.

🌐 **Live site:** [marcuslchong.com](https://marcuslchong.com) *(update with your domain)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) 4.x |
| Language | TypeScript (strict mode) |
| Styling | Scoped CSS + CSS custom properties |
| Fonts | Syne, Instrument Serif, DM Mono (Google Fonts) |
| Build output | Static HTML/CSS/JS (`dist/`) |
| Container | Docker + nginx:alpine |
| Reverse proxy | Nginx Proxy Manager |
| Hosting | Self-hosted NAS |

---

## Project Structure

```
my-portfolio/
├── public/
│   └── favicon.svg          # Favicon
│   └── profile.webp         # Profile photo (add your own)
├── src/
│   ├── components/
│   │   ├── Hero.astro        # Hero section with profile photo + badge
│   │   ├── About.astro       # Bio + skills sidebar
│   │   ├── Experience.astro  # Timeline of work experience
│   │   ├── Testimonials.astro # Sliding carousel of colleague feedback
│   │   └── Contact.astro     # Contact form (email service TBD)
│   ├── layouts/
│   │   └── BaseLayout.astro  # Nav, footer, global head
│   ├── pages/
│   │   └── index.astro       # All site data lives here — edit this file
│   └── styles/
│       └── global.css        # Design system, CSS variables, fonts
├── Dockerfile                # Multi-stage build (Node → nginx:alpine)
├── docker-compose.yml        # Compose config for NAS deployment
├── nginx.conf                # nginx config for serving static files
├── .dockerignore
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Local Development

### Prerequisites

- Node.js v18.17.1 or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Type-check
npx tsc --noEmit

# Build static output to ./dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Updating Content

All site content (name, bio, experience, testimonials, links) is managed in a single file:

```
src/pages/index.astro
```

Look for the `// ─── YOUR DATA` section at the top of the frontmatter. No need to touch any component files for content changes.

### Profile photo

1. Export your photo as `.webp` (use [Squoosh](https://squoosh.app) — aim for under 200KB)
2. Drop it into `public/profile.webp`
3. Update `index.astro`:
   ```ts
   profileImage: "/profile.webp",
   ```

---

## Deployment

### Build and run with Docker Compose

```bash
# Build the image and start the container
docker compose up -d --build

# Verify it's running
docker ps

# Test locally
curl http://localhost:3000
```

The container serves the static site on **host port 3000** → **container port 80**.

### Nginx Proxy Manager setup

In the NPM web UI (`http://your-nas-ip:81`):

1. **Add Proxy Host**
2. **Domain:** your domain or subdomain
3. **Scheme:** `http`
4. **Forward Hostname:** `portfolio` (container name) or your NAS LAN IP
5. **Forward Port:** `80`
6. **SSL tab:** Request a Let's Encrypt certificate, enable Force SSL

### Rebuilding after changes

```bash
docker compose up -d --build
```

---

## Docker Network

The `docker-compose.yml` expects an external Docker network named `proxy` — the same network your Nginx Proxy Manager container is on.

```bash
# Check your existing networks
docker network ls

# If your NPM network has a different name, update docker-compose.yml:
# networks:
#   proxy:
#     external: true
#     name: YOUR_NETWORK_NAME
```

---

## Roadmap

- [ ] Add profile photo
- [ ] Configure email service for contact form (Resend / Formspree)
- [ ] Set up CI/CD pipeline (auto-deploy on `git push`)
- [ ] Add projects section
- [ ] Connect custom domain

---

## Git Config

```bash
git config --global user.name "Marcus Chong"
git config --global user.email "marcuslchong@gmail.com"
```

---

## License

Personal portfolio — all rights reserved.