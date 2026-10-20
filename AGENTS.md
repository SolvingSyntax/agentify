## Architecture
- No TanStack Query or other TanStack libs besides the built-in router (user requirement); data loads via `useApi`/`useMutation` in src/hooks/use-api.ts.
- All backend calls go through src/lib/api/client.ts + services.ts; endpoint paths only in endpoints.ts; contract documented in API_CONTRACT.md.
- Zero demo data: never mock responses or seed entities; show loading/error/empty states instead.
- React Flow editor is lazy-loaded behind ClientOnly to stay out of SSR.
- Decorative floor motion is CSS-only and card tilt uses delegated pointer events on `.panel-hover` in AppShell; this keeps effects lightweight and disables tilt on touch or reduced motion.
