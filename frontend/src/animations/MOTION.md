# UGH Appliances — Motion systems (Phase 4)

Three intentional motion systems used across the storefront:

## 1. Cinematic scroll (Home hero — Phase 3)

- **Stack:** Lenis + GSAP ScrollTrigger + React Three Fiber  
- **Role:** Brand signature — pinned scrub story with particles and hob silhouette  
- **Reduced motion:** Static hero, no WebGL  

## 2. Scroll reveals & parallax (editorial sections)

- **Stack:** GSAP ScrollTrigger via `Reveal` and `ParallaxBand`  
- **Role:** Smeg-calm section entrances; Kitchen Line–style background drift on craft band  
- **Where:** Home categories/featured/craft, Catalogue, About, Contact, Product  
- **Reduced motion:** Instant visible state, no scrub  

## 3. Route & micro-interactions

- **Stack:** Framer Motion (`PageTransition`, gallery crossfade) + CSS sheens  
- **Role:** Subtle page enter/exit; product gallery fade; steel hover sheen on cards/categories  
- **Prefetch:** Product detail API warmed on card hover/focus/touch  
- **Reduced motion:** Page transitions skipped; gallery snaps; sheens disabled  

## Accessibility

- Skip link → `#main`  
- `:focus-visible` ember outline on interactive controls  
- Header: `aria-expanded`, `aria-controls`, `aria-haspopup`, Escape closes menus  
- Product thumbs: `role="listbox"` / `option` with `aria-selected`  
