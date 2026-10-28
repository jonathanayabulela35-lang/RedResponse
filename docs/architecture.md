# RedResponse architecture notes

## Operating model

- Every incident has an owning organization.
- Each department manages its own users, stations, response units, and dispatch assignments.
- Cross-department collaboration is represented through explicit incident shares and assistance requests.
- Sharing an incident does not transfer incident ownership.
- Dispatch actions should be server-side, permission checked, idempotent, and recorded in an append-only event trail.

## Recommended next implementation steps

1. Create a Supabase project and apply the migration in `supabase/migrations/001_initial_schema.sql` in a development environment.
2. Review the RLS policies with security testing before inserting real information.
3. Add Supabase Auth, organization onboarding and invitations.
4. Replace in-memory demo state with typed data access services and server-side dispatch functions.
5. Add a real map provider, geocoding, route estimates, location permission handling and stale-GPS indicators.
6. Add a durable dispatch delivery queue, mobile push delivery, acknowledgement retries, escalation and monitoring.
7. Add tested role-based cross-department sharing and data minimization.
8. Run simulations and a controlled pilot before any operational deployment.

## Important limitations

The included React app currently uses local in-memory demo records and an illustrative map. The SQL migration is a proposed backend foundation and is not automatically applied or connected to the front end. It requires review, testing and additional production hardening. Do not use the prototype to dispatch real emergency responses.


## Frontend organization

Page content is split into dedicated files under `src/pages/` and selected by `src/pages/index.js`. `src/App.jsx` owns the shared navigation shell and the current demo workflow state. Operational reusable components live under `src/components/operations/`. Reusable hooks and shared data/utilities live under `src/hooks/` and `src/lib/`.

The present demo state remains in memory. The included `useLocalStorageState` hook is intended only for non-sensitive UI preferences; incident data, credentials, dispatch records and location histories must use the secured backend instead.
