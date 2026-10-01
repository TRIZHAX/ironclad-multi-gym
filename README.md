# Ironclad Multi-Gym Management System

A production-oriented, multi-tenant gym platform built with Next.js, TypeScript, PostgreSQL, Prisma, and secure cookie sessions.

## Implemented flows

- Public gym applications with pending status and rate limiting
- Platform Owner approval/rejection and gym suspension/activation
- Transactional creation of a gym and its first owner
- Role-based dashboards for Platform Owner, Gym Owner/Admin, and Member
- Gym-owned admins, members, custom plans, memberships, and branding
- Time-limited QR issuance, extension, ban/unban, suspension, and permanent revocation APIs
- Camera and manual QR scanning with server-side access decisions
- Cross-gym rejection before any foreign member data is returned
- Granted and denied access records, attendance history, audit trails, and CSV reports
- Member QR display, membership status, and visit history
- Expiration notification worker and password-reset flow
- Dark/light themes and responsive layouts

## Security model

`gymId` is stored and indexed on every tenant-owned model. Normal APIs never accept a tenant identifier as authority: it is derived from the authenticated session. Record lookups combine the requested ID with that server-derived `gymId`. Platform-wide access requires `PLATFORM_OWNER`.

QR values are 256-bit random tokens. The database stores a SHA-256 lookup hash and an AES-256-GCM encrypted copy for the member's authenticated QR display. No password or personal data is encoded. Scanner decisions validate, in order, tenant, gym, member, QR state, access window, and membership. Wrong-gym attempts are logged against the scanning gym without foreign member/QR references.

Sessions use opaque 256-bit tokens; only token hashes are stored. Cookies are HTTP-only, SameSite=Lax, and Secure in production. Mutations reject cross-origin browser requests. Passwords use bcrypt with cost 12. Authentication and scanning are rate-limited. For distributed production rate limiting, replace the included in-process limiter with Redis/Upstash.

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Generate a QR encryption key with a cryptographically secure 32-byte base64 value.
3. Start PostgreSQL using the included Compose configuration, or provide another PostgreSQL URL.
4. Install dependencies: `npm install`.
5. Generate Prisma Client: `npm run db:generate`.
6. Apply migrations: `npm run db:migrate`.
7. Create the first Platform Owner: `npm run db:seed`.
8. Start the app: `npm run dev`.

The Platform Owner seed is idempotent and refuses to create a second Platform Owner.

## Production deployment

Provision PostgreSQL with encrypted connections, set all variables from `.env.example` in the deployment secret store, then run `prisma migrate deploy` during release. Set `APP_URL` and `PASSWORD_RESET_URL` to the production origin. Configure Resend credentials for password-reset delivery and invoke the notification endpoint daily with `Authorization: Bearer <CRON_SECRET>`.

Use a persistent Redis-backed rate limiter when deploying across multiple serverless instances. Add object storage and a signed-upload route before enabling direct logo/photo uploads; the current forms accept validated HTTPS asset URLs and never proxy arbitrary files.

## Validation

- `npm run typecheck`
- `npm test`
- `npm run build`

The access-policy tests cover successful entry, cross-gym denial, revoked/banned/suspended QR states, expired memberships, and suspended gyms.


## IRONCLAD UI refresh

The interface uses a clean, lime-accented fitness dashboard visual system inspired by the supplied reference: a compact workspace sidebar, responsive navigation, rounded data cards, modern tables, a branded IRONCLAD logo, and persistent dark/light theme selection. The default theme is dark; users can switch modes from the top bar.

Responsive behavior is handled through Tailwind breakpoints and the global design tokens in `app/globals.css`. The redesign changes presentation components and styles while retaining the existing Next.js routes, server-side access checks, Prisma data access, and API handlers.
