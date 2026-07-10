# NeuraX AI Admin Dashboard

Modern admin dashboard for NeuraX AI, built with React 19, Vite, TypeScript, Tailwind CSS, shadcn-style UI components, Lucide Icons, TanStack Table, Recharts, Zustand, Axios, and React Router.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Docker Deploy

```bash
docker compose up -d --build
```

The included Nginx config serves the SPA at `dashboard.amarlo.online` with route fallback for React Router.

## REST API Integration

Set the API base URL with:

```bash
VITE_API_URL=https://your-api.example.com/v1
```

The Axios client is located at `src/lib/api.ts` and automatically attaches `neurax_admin_token` from local storage as a bearer token.
