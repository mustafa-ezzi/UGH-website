/**
 * Phase 3 cinematic scroll chapters (progress 0–1)
 *
 * 0.00–0.10  Void     — brand mark in dust field
 * 0.10–0.28  Birth    — particles coalesce
 * 0.28–0.48  Form     — hob silhouette resolves
 * 0.48–0.65  Material — camera orbit + light sweep
 * 0.65–0.82  Reveal   — CTA + kitchen promise
 * 0.82–1.00  Release  — hand-off into category ribbon
 */
export const HERO_CHAPTERS = [
  { id: 'void', start: 0, end: 0.1 },
  { id: 'birth', start: 0.1, end: 0.28 },
  { id: 'form', start: 0.28, end: 0.48 },
  { id: 'material', start: 0.48, end: 0.65 },
  { id: 'reveal', start: 0.65, end: 0.82 },
  { id: 'release', start: 0.82, end: 1 },
] as const
