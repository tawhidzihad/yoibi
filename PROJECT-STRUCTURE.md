# YOIBI Project Structure

The repository is intentionally split into frontend, backend, shared contracts, documentation, and the read-only legacy reference.

```text
yoibi/
├── .agents/
│   ├── AI-AGENT.md
│   ├── skills/
│   │   ├── skills0-javascript.md
│   │   ├── skills0-nextjs.md
│   │   ├── skills0-tailwindcss.md
│   │   ├── skills0-react-hook-form.md
│   │   ├── skills0-zod.md
│   │   ├── skills0-nodejs.md
│   │   ├── skills0-expressjs.md
│   │   ├── skills0-mongodb.md
│   │   ├── skills0-better-auth.md
│   │   ├── skills0-socketio.md
│   │   ├── skills0-cloudinary.md
│   │   ├── skills0-livekit.md
│   │   ├── skills0-testing.md
│   │   ├── skills0-accessibility-responsive.md
│   │   ├── skills0-git-github.md
│   │   └── skills0-deployment-railway.md
│   └── commands/
│       └── yoibi-resume.md
│
├── docs/
│   ├── CODE-STANDARDS.md
│   ├── MANDATORY-RULES.md
│   ├── WORKBASE.md
│   ├── MODEL-HANDOFF.md
│   ├── FRONTEND-GUIDE.md
│   ├── BACKEND-GUIDE.md
│   ├── SECURITY-RULES.md
│   ├── MIGRATION-PLAN.md
│   └── LEGACY-DESIGN-MAP.md
│
├── contracts/
│   ├── API-CONTRACT.md
│   └── openapi.yaml
│
├── legacy/
│   └── original-yoibi/
│       ├── .agents/skills/
│       └── .github/workflows/
│
├── frontend/
│   ├── package.json
│   ├── README.md
│   ├── eslint.config.js
│   ├── next.config.js
│   ├── postcss.config.mjs
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── layout.js
│       │   ├── page.js
│       │   ├── globals.css
│       │   ├── (public)/
│       │   ├── (auth)/
│       │   ├── (protected)/
│       │   └── admin/
│       ├── features/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── follows/
│       │   ├── tweets/
│       │   ├── comments/
│       │   ├── reactions/
│       │   ├── retweets/
│       │   ├── media-upload/
│       │   ├── messaging/
│       │   ├── streams/
│       │   ├── meet-up/
│       │   ├── notifications/
│       │   ├── reports/
│       │   └── admin/
│       ├── shared/
│       │   ├── ui/
│       │   ├── forms/
│       │   ├── layout/
│       │   ├── feedback/
│       │   ├── media/
│       │   └── utils/
│       └── lib/
│           ├── api/
│           ├── auth/
│           ├── env/
│           └── utils/
│
└── backend/
    ├── package.json
    ├── README.md
    ├── eslint.config.js
    ├── .env.example
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        ├── routes/
        ├── controllers/
        │   ├── create/
        │   ├── read/
        │   ├── update/
        │   └── delete/
        ├── services/
        │   ├── create/
        │   ├── read/
        │   ├── update/
        │   └── delete/
        ├── repositories/
        ├── models/
        ├── validators/
        ├── middleware/
        ├── sockets/
        ├── integrations/
        │   ├── cloudinary/
        │   └── livekit/
        └── utils/
```

## Ownership rules
- `src/app`: route composition, layouts, loading/error boundaries, metadata. Keep feature business logic out.
- `src/features`: one product system at a time. Feature code may use `shared` and `lib`, but must not reach into another feature's private internals.
- `src/shared`: reusable UI and generic helpers with no YOIBI feature-specific business rules.
- `src/lib/api`: one central API client and request helpers. Do not scatter raw `fetch` details across pages.
- `backend/routes`: URL and HTTP method wiring only.
- `backend/controllers`: parse HTTP input and shape HTTP output; keep business rules in services.
- `backend/services`: business logic.
- `backend/repositories`: database access.
- `backend/models`: MongoDB schemas/models.
- `backend/validators`: request validation.
- `backend/middleware`: auth, authorization, rate limits, CORS, error handling, request context.
- `backend/sockets`: Socket.IO events and guards.
- `backend/integrations`: vendor SDK wrappers only.
- `contracts`: frontend/backend agreement. Changes here must be reviewed by both sides.

## Legacy project rule
`legacy/original-yoibi` is a read-only reference during migration. Copy design language, assets, content structure, and useful deployment knowledge. Do not copy obsolete TypeScript/Vite architecture into the new applications.
