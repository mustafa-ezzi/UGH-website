# UGH Appliances Website

Premium home-appliances catalogue (showcase only — no cart / checkout).

**Stack:** Django + DRF · React + Vite · Lenis · GSAP · React Three Fiber

See `UGH-APPLIANCES-WEBSITE-PLAN.md` for the full design and phase plan.

## Quick start

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_catalogue
python manage.py setup_roles
python manage.py createsuperuser
python manage.py runserver
```

- Admin (Django, advanced): http://127.0.0.1:8000/admin/
- **Manage panel (React, for clients):** http://localhost:5173/manage/
- API: http://127.0.0.1:8000/api/products/

Sign in to `/manage` with any **staff** user (superuser or Editors group with `is_staff=True`).
Editors group: `setup_roles` then assign staff users in Admin → Users (superusers stay full Superadmin)

Copy `.env.example` to `.env`. Default DB is SQLite; set `DATABASE_ENGINE=postgres` for PostgreSQL.
Enquiry emails print to the console locally; set `notify_enquiries_to` in Site settings.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Storefront: http://localhost:5173/

Vite proxies `/api` and `/media` to Django on port 8000.

## Phase status

- [x] Phase 0 — Foundations
- [x] Phase 1 — Catalogue backend + Admin CRUD + seed + public API
- [x] Phase 2 — Storefront wired to API
- [x] Phase 3 — Cinematic hero
- [x] Phase 4 — Motion polish
- [x] Phase 5 — Admin enhancements
- [ ] Phase 6 — Launch hardening
