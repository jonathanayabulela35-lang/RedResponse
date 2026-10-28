# RedResponse department workspaces: deployment files

This update adds the public-facing website, organisation sign-up and sign-in, department-specific onboarding, organisation-scoped operational data, unit registration, and controlled assistance requests.

## Files included

- `src/RootApp.jsx` routes public pages and authenticated organisation workspaces.
- `src/components/PublicPortal.jsx` provides the public website.
- `src/components/AccessPortal.jsx` handles Supabase account sign-up/sign-in and organisation registration.
- `src/lib/departmentConfig.js` defines the department choices and incident types.
- `src/lib/supabaseClient.js` configures the Supabase client.
- `src/App.jsx` loads and writes incidents and units within the signed-in organisation.
- `src/pages/ResponseUnitsPage.jsx` registers units and persists availability updates.
- `supabase/migrations/002_department_onboarding.sql` adds onboarding metadata and secure RPCs for organisation registration and assistance requests.

## Apply the update

1. Copy the included updated and new files into the matching paths in the existing RedResponse repository. Keep the existing `src/pages` and `src/components` folders and their other files.
2. In the Supabase SQL Editor for the RedResponse project, run `supabase/migrations/002_department_onboarding.sql` after the existing `001_initial_schema.sql` migration. Do not run migration 001 again if it has already been applied successfully.
3. In Cloudflare Pages, open **Settings → Environment variables** and set:
   - `VITE_SUPABASE_URL` to the project's Supabase URL.
   - `VITE_SUPABASE_ANON_KEY` to the project's publishable/anon key. Never use a `service_role` key in frontend variables.
4. Trigger a new Cloudflare Pages deployment.
5. In Supabase Authentication settings, configure the production site URL and allowed redirect URLs for the deployed RedResponse domain. Enable email confirmation if required by the organisation's account policy.
6. Register an organisation, choose its department type, and sign in. The operational workspace will only query incidents and units for that organisation.

## Operational prerequisites still required before live emergency use

The UI and core database writes are not a certification for live emergency dispatch. Configure and test responder notification delivery and acknowledgement, recipient-side assistance approval, mapping/geocoding and GPS sources, personnel invitations and role administration, immutable audit events, backups/recovery, monitoring, privacy/retention policies, and incident-response procedures. The current map deliberately does not fabricate live coordinates. The assistance workflow records a request and a pending share; a complete receiving-organisation acceptance workflow is still required before shared incident details become visible.
