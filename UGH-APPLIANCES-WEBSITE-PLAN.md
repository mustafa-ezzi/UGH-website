# UGH Appliances — Website Design, Animation & Build Plan

**Brand:** UGH Appliances  
**Type:** Premium home-appliances catalogue (showcase only — no cart / checkout)  
**References:** [Taheri.shop](https://taheri.shop/) · [Smeg UK](https://www.smeguk.com/) · [Kitchen Line](https://kitchenline.com/)  
**Stack (locked recommendation):** Django (API + Admin) · React + Vite (storefront) · GSAP + Lenis + React Three Fiber (cinematic UI)  
**Target fidelity to brief:** **92–98%** (design language fused from three refs; hero animation adapted from jewellery → appliances)

---

## 1. Vision in one sentence

A **catalogue-first** kitchen appliances site where the first scroll feels like Taheri’s “born from dust” magic, the product ambience feels like Smeg’s Italian showroom polish, and the immersive background / category storytelling feels like Kitchen Line — all under the **UGH Appliances** brand.

---

## 2. What we take from each reference

| Source | Steal this | Adapt for appliances |
|--------|------------|----------------------|
| **[Taheri.shop](https://taheri.shop/)** | Full-viewport cinematic first page; scroll-driven story; floating dust / particle field; brand as hero; “Scroll” cue; dark atmospheric void → product reveal | Dust becomes warm kitchen light motes / stainless sparkle / steam-like particles; headline e.g. *“Formed in fire.”* / *“Precision born from heat.”*; hero object = stove / hob / oven silhouette (2D sequence or lightweight 3D), not jewellery |
| **[Smeg UK](https://www.smeguk.com/)** | Large editorial photography; calm luxury spacing; product-as-hero sections; mega-nav by category; “Technology with Style” tone; full-bleed lifestyle + product shots; soft motion on section enter | Same quiet confidence: ovens, hobs, chimneys, sinks as lifestyle heroes; no cluttered promo chips on hero |
| **[Kitchen Line](https://kitchenline.com/)** | Kitchen-world theme; hero slider energy; showroom / “shop by category”; warm appliance lifestyle backgrounds; parallax / background scroll feel; catalogue storytelling (hobs, hoods, ovens, sinks) | One continuous scroll narrative instead of noisy multi-slider hero; keep category depth and showroom vibe |

### Explicit non-goals (from your brief)

- No **Add to Cart**, no **Checkout**, no payment flows  
- Wishlist / account commerce optional later — **Phase 1: browse + enquire only**  
- Admin exists to manage catalogue (CRUD, prices, images, categories, visibility)

---

## 3. Brand & visual system

### 3.1 Name & voice

- **Brand mark:** `UGH` (large, primary) + `Appliances` (secondary, smaller tracking)  
- **Tone:** Quiet luxury, technical craft, kitchen as stage — Smeg-like editorial, not loud retail  
- **Tagline options (hero):**  
  - *Precision born from heat.*  
  - *The kitchen, remade.*  
  - *Form. Function. Fire.*

### 3.2 Color tokens (fused palette — avoid generic purple AI look)

Kitchen Line warmth + Smeg steel + Taheri cinematic dark for hero only.

```css
:root {
  /* Surfaces */
  --ugh-void: #0a0908;           /* Taheri-style hero black */
  --ugh-ink: #141210;            /* Near-black body */
  --ugh-stone: #1c1a17;          /* Elevated dark panels */
  --ugh-mist: #f4f1ec;           /* Light catalogue sections (warm, not cream-cliché overload) */
  --ugh-paper: #ebe6df;          /* Alt light band */

  /* Metals & accents */
  --ugh-steel: #8a9199;          /* Smeg stainless feel */
  --ugh-chrome: #c5ccd3;
  --ugh-ember: #c45c26;          /* Heat / hob glow — primary CTA accent */
  --ugh-brass: #b8956c;          /* Soft luxury line accents */
  --ugh-flame: #e8a05c;          /* Particle highlights */

  /* Text */
  --ugh-text-on-dark: #f7f4ef;
  --ugh-text-muted-dark: #a39e96;
  --ugh-text-on-light: #1a1714;
  --ugh-text-muted-light: #5c574f;

  /* Lines */
  --ugh-hairline: rgba(255,255,255,0.12);
  --ugh-hairline-dark: rgba(20,18,16,0.12);
}
```

**Rule:** Hero + immersive story = dark void. Catalogue grids / category pages = light stone/mist like Smeg editorial. Never flat single-color full page.

### 3.3 Typography

Do **not** use Inter / Roboto / Arial / system-only stacks.

| Role | Direction | Examples to license / self-host |
|------|-----------|----------------------------------|
| Display / brand | Expressive geometric or refined grotesque | **Satoshi**, **Cabinet Grotesk**, **PP Neue Montreal**, or **Clash Display** |
| Editorial headlines | Slight contrast or high-end sans | **Instrument Sans**, **General Sans**, **Switzer** |
| Body | Highly readable sans | **Satoshi** / **Geist** alternative: **Manrope** only if needed |
| Micro labels | Wide tracking uppercase | Same family, 0.12–0.2em letter-spacing |

### 3.4 Imagery rules (Smeg + Kitchen Line)

- **Full-bleed hero only** — edge-to-edge visual plane; no inset cards in first viewport  
- Real product / kitchen atmosphere photos (stoves, chimneys, ovens, wash basins)  
- Dark vignette + film grain optional on hero overlays  
- Product detail: large 1:1 or 4:5 shots on mist background, not cluttered white Amazon style  
- No floating promo badges / stickers on hero media

### 3.5 Layout principles (your design rules + refs)

1. First viewport = **one composition**: brand + one headline + one line + scroll cue + dominant visual  
2. Brand must remain hero-level (Taheri test: remove nav → still unmistakably UGH)  
3. **One job per section**  
4. **Default: no cards** — cards only when interaction needs a container (filters, admin forms)  
5. Motion creates hierarchy, not noise — ship **2–3 signature motions** + supporting micro-interactions  

---

## 4. Animation & interaction system

### 4.1 Recommended animation stack (better than “React alone”)

| Layer | Library | Why |
|-------|---------|-----|
| Smooth scroll | **Lenis** | Buttery scroll physics like luxury jewellery sites |
| Scroll choreography | **GSAP + ScrollTrigger** (+ `@gsap/react`) | Industry standard for pinned sections, scrub timelines |
| Magical dust / 3D depth | **Three.js + React Three Fiber + Drei** | Taheri-like particle field, light shafts, metallic product silhouette |
| UI micro-motion | **Framer Motion** (or Motion One) | Page transitions, filter drawer, hover fades — keep light |
| Optional image sequences | Canvas frame scrub | If we shoot/render appliance “forming” frames like jewellery sites |

**Decision:** Stay on **React + Vite** for the storefront. Do **not** switch to Next unless SEO becomes Phase-2 priority; for catalogue + cinematic hero, Vite + R3F is ideal. Django remains the API/admin brain.

### 4.2 Homepage scroll story (Taheri-inspired, appliances-native)

**Structure:** ~5–7 pinned / scrubbed chapters inside one continuous scroll experience, then hand off to “normal” Smeg-style catalogue sections.

| Chapter | Scroll % (approx) | Visual | Copy |
|---------|-------------------|--------|------|
| 0 — Void | 0–10% | Dark field, floating dust (warm ember + steel sparks) | Brand mark fades in |
| 1 — Birth | 10–28% | Particles coalesce toward center | *Precision born from heat.* |
| 2 — Form | 28–48% | Silhouette of hob / range resolves from dust (shader or GLB) | Category whisper: Stoves · Chimneys · Ovens · Basins |
| 3 — Material | 48–65% | Camera orbit / light sweep across brushed steel | Short supporting line only |
| 4 — Reveal | 65–82% | Lifestyle kitchen plate fades in (Kitchen Line ambience) | CTA: *Explore the catalogue* |
| 5 — Release | 82–100% | Unpin → scroll into Smeg-style category strip | Nav becomes solid |

**Technical approach:**

1. Fixed full-viewport `<Canvas>` (R3F) behind HTML overlay  
2. Lenis scroll progress → GSAP timeline `seek()` (or ScrollTrigger scrub)  
3. Particle system: `Points` / custom shader — dust rises, drifts with slight turbulence, responds to scroll velocity  
4. Reduced motion: `@media (prefers-reduced-motion: reduce)` → static hero + fade, no scrub  
5. Mobile: lower particle count, DPR cap `Math.min(devicePixelRatio, 1.5)`, optional 2D fallback sequence  

### 4.3 Signature motions (must ship)

1. **Hero particle coalescence** (Taheri DNA)  
2. **Section enter:** headline clip-reveal + image parallax 8–12% (Smeg calm)  
3. **Category hover:** soft steel sheen / image scale 1.04 + underline draw  

Supporting (not competing):

- Page transition: 300–500ms opacity + slight Y  
- Sticky header: blur + hairline after leaving hero  
- Product image crossfade on gallery  
- Admin: no cinematic effects — crisp, fast CRUD only  

### 4.4 Kitchen Line “background scroll” translation

After the cinematic hero:

- Full-bleed lifestyle bands with **background-attachment / parallax layers** (GSAP scrub, not CSS `fixed` only — better control)  
- Category chapters: *Hobs · Hoods · Ovens · Sinks & Basins · Hardware* with one dominant image each  
- Optional virtual showroom teaser section (static map / branch list later)  

### 4.5 Performance budgets

| Metric | Target |
|--------|--------|
| LCP (catalogue pages) | < 2.5s on mid broadband |
| Hero JS main-thread | Idle particles ≤ ~8k desktop / ≤ ~2.5k mobile |
| Texture sizes | WebP/AVIF; hero ≤ ~400–600KB |
| Frame rate | 60fps desktop, 30–60 mobile with DPR clamp |
| Bundle | Route-split 3D hero so catalogue pages don’t load full R3F unless needed |

---

## 5. Information architecture (no commerce checkout)

### 5.1 Public pages

| Route | Purpose |
|-------|---------|
| `/` | Cinematic hero + category story + featured products |
| `/catalogue` | All products, filters (category, brand, finish, fuel type) |
| `/catalogue/:category` | Category landing (Smeg mega-feel, Kitchen Line themes) |
| `/product/:slug` | Detail: gallery, specs, price (display only), enquiry CTA |
| `/brands` | Brand grid |
| `/about` | Brand story |
| `/contact` | Enquiry / showroom / WhatsApp / email |
| `/showrooms` (optional) | Locations — Kitchen Line inspired |

**CTAs allowed:** Enquire · Call · WhatsApp · Visit showroom · Download brochure (PDF)  
**CTAs forbidden:** Add to cart · Buy now · Checkout · Payment  

### 5.2 Admin (Django Admin or custom React admin)

| Capability | Priority |
|------------|----------|
| Products CRUD | P0 |
| Price create/edit (display) | P0 |
| Categories / subcategories | P0 |
| Image upload (multi) + order | P0 |
| Brands | P0 |
| Featured / sort order / publish toggle | P0 |
| Specs (JSON or key-value) | P1 |
| SEO fields (title, meta, OG) | P1 |
| Enquiry inbox view | P1 |
| Soft delete / archive | P1 |
| Staff roles (Admin / Editor) | P2 |

---

## 6. Technical architecture

```
┌─────────────────────────────────────────────┐
│  React + Vite (Storefront)                  │
│  Lenis · GSAP · R3F · Framer Motion         │
│  React Router · TanStack Query · Zustand    │
└──────────────────┬──────────────────────────┘
                   │ REST or GraphQL (REST preferred Phase 1)
┌──────────────────▼──────────────────────────┐
│  Django + Django REST Framework             │
│  JWT or session auth (admin only)           │
│  PostgreSQL · Media (S3 / local)            │
│  Django Admin (+ optional custom SPA admin) │
└─────────────────────────────────────────────┘
```

### 6.1 Backend models (core)

- `Brand` — name, logo, slug, description  
- `Category` — name, slug, parent, hero image, sort  
- `Product` — name, slug, brand, categories M2M, SKU, price, currency, short_desc, long_desc, specs JSON, is_featured, is_published, sort_order  
- `ProductImage` — product FK, image, alt, sort  
- `Enquiry` — name, phone, email, message, product FK nullable, created_at  
- `SiteSetting` — hero copy, contact, socials (singleton)  

### 6.2 API surface (Phase 1)

```
GET  /api/products/              ?category=&brand=&featured=&search=
GET  /api/products/:slug/
GET  /api/categories/
GET  /api/brands/
GET  /api/settings/
POST /api/enquiries/
```

Admin mutations via Django Admin or authenticated `/api/admin/...` later.

### 6.3 Repo layout (monorepo recommended)

```
UGH-Website/
├── backend/                 # Django project
│   ├── config/
│   ├── apps/
│   │   ├── catalogue/
│   │   ├── enquiries/
│   │   └── core/
│   └── manage.py
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── scenes/          # R3F hero
│   │   ├── animations/      # GSAP timelines
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   └── package.json
├── UGH-APPLIANCES-WEBSITE-PLAN.md
└── README.md
```

---

## 7. Page-by-page design brief

### 7.1 Home

1. **Cinematic hero** (Taheri) — particles, brand, one line, scroll  
2. **Category ribbon** — 4–5 categories, full-bleed hover images (Kitchen Line themes)  
3. **Featured appliances** — Smeg editorial: large product + short copy, no card chrome  
4. **Craft band** — parallax kitchen background + one sentence brand promise  
5. **Enquiry strip** — single CTA  
6. **Footer** — minimal, steel hairlines  

### 7.2 Catalogue

- Sticky filter rail (desktop) / bottom sheet (mobile)  
- Grid: image-dominant, name, brand, price as text (not buy button)  
- Hover: slow zoom + steel underline “View”  

### 7.3 Product detail

- Gallery with crossfade  
- Specs table  
- Price display  
- Related products  
- Primary: **Enquire about this product**  

### 7.4 Admin

- Dense, light UI (not cinematic)  
- List + edit forms, image reorder, publish toggle  
- Preview link to storefront slug  

---

## 8. Phased build plan (accuracy-oriented)

Each phase ends with a **Definition of Done**. Estimated fidelity to final vision compounds; Phase 6 ≈ **90–100%** of this document’s scope.

---

### Phase 0 — Foundations (Week 0–1)

**Goals:** Repo, tooling, design tokens, empty shells.

**Tasks:**

- [x] Initialize monorepo: `backend/` Django + DRF, `frontend/` Vite React TS  
- [x] PostgreSQL, env files, CORS, media config  
- [x] Install frontend: Lenis, GSAP, `@gsap/react`, three, `@react-three/fiber`, `@react-three/drei`, framer-motion, react-router, tanstack-query  
- [x] Global CSS variables (Section 3.2), fonts self-hosted  
- [x] Base layout: Header / Footer / Outlet  
- [x] Reduced-motion utilities  

**DoD:** Both apps run locally; blank pages share brand tokens; no broken imports.

**Accuracy contribution:** ~15% (skeleton of final system)

---

### Phase 1 — Catalogue backend + Admin CRUD (Week 1–2)

**Goals:** Real data model; staff can manage products without frontend polish.

**Tasks:**

- [x] Models: Brand, Category, Product, ProductImage, Enquiry, SiteSetting  
- [x] Django Admin fully usable (inlines for images, previews)  
- [x] Seed 8–12 sample products (stoves, chimneys, ovens, basins)  
- [x] Public read-only API + enquiry POST  
- [x] Image upload validation (size/type)  
- [x] Price as `DecimalField`; currency field default PKR/USD as needed  

**DoD:** Admin can create/edit/delete/publish products and change prices; API returns published catalogue only.

**Accuracy contribution:** ~35% cumulative

---

### Phase 2 — Storefront IA + Smeg/Kitchen Line UI shell (Week 2–3)

**Goals:** All public routes working with real API data; ambience correct before heavy 3D.

**Tasks:**

- [x] Home (static placeholder hero), Catalogue, Category, Product, About, Contact  
- [x] Smeg-like spacing, typography, full-bleed category sections  
- [x] Kitchen Line–style lifestyle bands + parallax backgrounds  
- [x] Product grid + detail + enquiry form wired to API  
- [x] Responsive nav (mega-menu lite for categories)  
- [x] Loading / empty / error states  

**DoD:** Full browse + enquire path on mobile & desktop without 3D hero yet.

**Accuracy contribution:** ~55% cumulative

---

### Phase 3 — Taheri-grade cinematic hero (Week 3–5) ★ Critical

**Goals:** First-page magical scroll is the brand signature.

**Tasks:**

- [x] R3F canvas: particle dust system (ember + steel palette)  
- [x] Lenis + GSAP ScrollTrigger scrub timeline (chapters in Section 4.2)  
- [x] Brand + headline overlay choreography  
- [x] Appliance silhouette reveal (GLB or procedural / image sequence)  
- [x] Mobile performance pass + reduced-motion fallback  
- [x] Hand-off animation into Category ribbon  

**DoD:** Stakeholders feel “Taheri-like” on first scroll while clearly in an appliances world; 60fps desktop on mid hardware.

**Accuracy contribution:** ~75% cumulative

---

### Phase 4 — Motion polish + Smeg micro-interactions (Week 5–6)

**Goals:** Site feels alive everywhere, not only on home.

**Tasks:**

- [x] Scroll-triggered text reveals on category / about  
- [x] Image parallax bands  
- [x] Hover sheens, gallery transitions  
- [x] Page transitions (subtle)  
- [x] Prefetch product detail on hover  
- [x] Accessibility: focus states, skip link, aria on nav  

**DoD:** At least 3 intentional motion systems documented and consistent; Lighthouse a11y ≥ 90.

**Accuracy contribution:** ~85% cumulative

---

### Phase 5 — Admin enhancement & content ops (Week 6–7)

**Goals:** Day-to-day catalogue operations are painless.

**Tasks:**

- [x] Image drag-reorder, bulk publish  
- [x] Featured flags + homepage curation fields in SiteSetting  
- [x] Enquiry list + email notification (optional)  
- [x] Optional lightweight custom admin SPA **or** stick with Django Admin if sufficient  
- [x] Role: Editor vs Superadmin  

**DoD:** Non-developer staff can update prices/images without deploy.

**Accuracy contribution:** ~92% cumulative

---

### Phase 6 — Hardening, SEO, launch (Week 7–8)

**Goals:** Production-ready.

**Tasks:**

- [ ] SEO: meta, OG images, sitemap, robots  
- [ ] CDN / S3 media, gzip/brotli, caching headers  
- [ ] Error tracking (Sentry), uptime  
- [ ] Cross-browser QA (Chrome, Safari, Firefox, Edge)  
- [ ] Mobile particle fallback QA  
- [ ] Content freeze + final photography pass  
- [ ] Deploy: frontend static (Netlify/Vercel/Nginx) + Django (Gunicorn/Docker)  

**DoD:** Public launch checklist signed off; matches this plan at **≥ 90%**. Stretch **95–100%** if photography + GLB hero are production-grade.

**Accuracy contribution:** **90–100%**

---

## 9. Accuracy & risk matrix

| Area | Target accuracy | Risk | Mitigation |
|------|-----------------|------|------------|
| Visual fusion (3 sites) | 90–95% | Looking like a clone of one only | Strict section ownership: Hero=Taheri, Ambience=Smeg, Theme bands=Kitchen Line |
| Hero animation | 92–98% | Perf on low-end phones | DPR clamp, particle LOD, reduced-motion static |
| Catalogue UX | 95–100% | Scope creep into e-commerce | Hard ban on cart/checkout in PR checklist |
| Admin CRUD | 95–100% | Custom admin overbuilt | Start Django Admin; custom only if blocked |
| Brand typography/color | 90–95% | Generic AI aesthetic | Locked tokens in Section 3; design review gate Phase 2 |
| Content/photography | 80–100% | Depends on assets you provide | Use placeholders until real kitchen shots arrive |

**Overall plan confidence:** **~94%** that following these phases yields the intended fused experience, contingent on quality product imagery and one solid appliance 3D/sequence asset for the hero.

---

## 10. Asset checklist (you provide)

- [ ] Logo SVG (wordmark + mark)  
- [ ] 20–40 product photos (transparent or studio + lifestyle)  
- [ ] 4–6 full-bleed kitchen lifestyle images (Kitchen Line energy)  
- [ ] Optional: GLB of a signature stove/hob **or** 60–120 frame image sequence for scroll scrub  
- [ ] Brand fonts license files  
- [ ] Contact, WhatsApp, address, social links  
- [ ] Initial product spreadsheet (name, category, brand, price, specs)

---

## 11. Success criteria (final acceptance)

1. First viewport passes the **brand test** (recognizable as UGH without nav).  
2. First scroll feels **magical / particle-driven** like Taheri, but appliance-themed.  
3. Below-the-fold feels **Smeg-calm and editorial**, not busy retail.  
4. Category storytelling and kitchen atmosphere echo **Kitchen Line**.  
5. Users can browse full catalogue and enquire — **never** cart/checkout.  
6. Admin can CRUD products and change prices without developer help.  
7. Motions respect `prefers-reduced-motion`.  
8. Desktop hero holds ~60fps; mobile remains smooth with LOD.  

---

## 12. Immediate next step after this document

**Phase 0 kickoff:** scaffold Django + React monorepo, lock design tokens, and build a non-3D homepage shell so Phase 3 particles have a real page to land in.

When you say go, we start Phase 0 in this repo (`d:\UG Appliences\UG-Website`).

---

## Appendix A — Copy bank (starter)

- Hero: *Precision born from heat.*  
- Support: *Stoves, chimneys, ovens, and basins — crafted for kitchens that mean something.*  
- Categories: Stoves & Hobs · Chimneys & Hoods · Ovens · Sinks & Basins · Hardware  
- Enquiry: *Ask about this piece — our team will respond with availability and guidance.*  

## Appendix B — Reference links

- https://taheri.shop/  
- https://www.smeguk.com/  
- https://kitchenline.com/  

## Appendix C — Why not other frameworks?

| Option | Verdict |
|--------|---------|
| Next.js | Better SEO later; heavier for R3F hero. Revisit Phase 6+ if organic search is critical. |
| Plain CSS animations | Insufficient for Taheri-level scrub. |
| Only Framer Motion | Great micro-UI; weak for scroll-pinned cinematic timelines → pair with GSAP. |
| Webflow | Beautiful but poor fit for Django catalogue admin + custom particle hero. |
| Django templates only | Cannot reach Taheri/Smeg motion fidelity. |

**Final stack call:** Django + DRF + React/Vite + Lenis + GSAP + R3F.
