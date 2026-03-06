# ThreeDungeons-Admin

Admin panel and backend for the ThreeDungeons Residency RPG telemetry and authentication system.

## Contents

- **supabase/** – Database schema, RLS policies, auth trigger, Edge Functions (resident-login, report-telemetry)

Planning documents (implementation plan, design guidelines, proposal, dev setup) live in the parent repo: `../Planning Documents/`

## Quick Start

1. Create a Supabase project and obtain Project URL + anon key
2. Run migrations (see `supabase/README.md`)
3. Deploy Edge Functions for resident auth and telemetry
4. Build the Leader Dashboard (React + Tailwind + Flowbite) per the planning doc
