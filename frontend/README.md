# University Management System frontend

React 19 and TypeScript frontend built with Vite.

## Commands

```bash
npm ci                 # install the locked dependencies
npm run dev            # development server on http://localhost:5173
npm run test:run       # run the Vitest suite once
npm run typecheck      # validate TypeScript without emitting files
npm run build          # production bundle in dist/
```

The application reads the API base URL from `VITE_API_URL` at build time. Copy
`.env.example` to `.env.local` to override the local default. Production builds
must provide their deployed `/api/v1` URL explicitly.
