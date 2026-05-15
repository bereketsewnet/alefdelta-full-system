# ALEF-DELTA SACCO Backend

Node.js + Express backend for the ALEF-DELTA SACCO Management System. The service exposes loan, member, transaction, and notification APIs as described in the system specification. MySQL is used as the backing data store with raw SQL migrations.

## Project layout

```
backend/
  src/
    core/                # config, db helpers, middleware and utilities
    modules/             # domain modules (auth, members, loans, etc)
    api/routes.js        # central router
  migrations/            # ordered SQL migrations
  seeds/                 # SQL seed files
  scripts/               # DB utility scripts + admin credential output
  uploads/               # local file uploads target (served statically)
  bot/                   # aiogram Telegram bot service (see below)
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template and adjust secrets:
   ```bash
   cp .env.example .env
   ```
3. Run database migrations and seed data:
   ```bash
   npm run migrate
   npm run db:seedall
   npm run seed:admin   # generates admin credentials -> scripts/admin_credentials.txt
   ```
4. Start the API server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. Access Swagger UI documentation:
   - Open your browser to: `http://localhost:4000/api-docs`
   - The interactive API documentation allows you to test endpoints directly

### npm scripts

| Script | Description |
| --- | --- |
| `npm start` | Start Express server (production mode) |
| `npm run dev` | Start server with nodemon |
| `npm run lint` | Run ESLint over `src/**.js` |
| `npm test` | Execute Jest unit + integration tests |
| `npm run migrate` | Run ordered SQL migrations in `migrations/` |
| `npm run db:reset` | Drop every table, then re-run migrations |
| `npm run db:seedall` | Apply the sample seed dataset |
| `npm run seed:admin` | Create a fresh admin user + credentials file |

Scripts rely on the same `.env` configuration used by the runtime server.

## Database

- Uses `mysql2/promise` with pooled connections. All money-moving operations execute inside an explicit transaction with optimistic locking `version` field on accounts.
- Migration runner executes raw SQL files in lexical order.
- Seed files:
  - `seed_admin.sql` is parameterised; the `seed:admin` script injects secure credentials and writes them to `scripts/admin_credentials.txt` (chmod 600).
  - `seed_all.sql` seeds example members, accounts, loan products, and staff users.

## Key features

- **Authentication** – staff (username/password) and members (phone/password) with JWT access + refresh tokens, rate-limited login endpoints, OTP-based member password reset, admin-only reset endpoint.
- **Role-based access control** – middleware ensures only specific staff roles can access money movement, approval, or reporting endpoints.
- **Members & KYC** – CRUD APIs, profile + ID uploads stored under `uploads/members/{memberId}`. Beneficiaries support front/back ID uploads.
- **Accounts & Transactions** – Full CRUD for accounts (create, list, get, update, close, freeze/unfreeze). Deposit/withdraw endpoints enforce idempotency via `Idempotency-Key`, run inside DB transactions, and use optimistic locking to protect concurrency. Receipt uploads stored under `uploads/transactions/{account}`.
- **Loans** – Gatekeeper + affordability checks, 1/3 rule, schedule preview for flat and declining interest products, guarantor and collateral uploads, lien management when approving.
- **Audit + Logging** – All approval and money-moving actions write to `audit_logs` and request logs flow through Winston.
- **Notifications** – `/notifications/send-notification` forwards messages to the aiogram bot webhook with bot token authentication.
- **OpenAPI + Swagger UI + Postman** – Interactive API documentation available at `/api-docs` (Swagger UI), `openapi.yaml` for the spec, and `postman_collection.json` for Postman imports.

## Testing

Jest covers gatekeeper calculations, idempotency caching, optimistic locking helper, and an integration spec that simulates concurrent withdrawals via the transaction service.

```
npm test
```

## Telegram bot (aiogram v3)

A lightweight bot lives in `bot/`:

```
bot/
  main.py           # aiogram application entrypoint (webhook + polling examples)
  requirements.txt  # Python dependencies
```

Configure the bot via environment variables (`BOT_TOKEN`, `BOT_WEBHOOK_URL`). The backend forwards approved notifications to the bot via `/notifications/send-notification` – supply `chat_id`, `message`, and optional attachment URLs.

## Security notes

- Always run behind HTTPS in production.
- Keep `.env` out of version control; rotate JWT and SMTP secrets regularly.
- Uploads are validated for MIME type and stored per-entity to avoid traversal attacks.
- Authentication routes are rate-limited; OTP requests are email-based with configurable expiry.

## Further reading

- `openapi.yaml` – canonical API contract.
- `postman_collection.json` – sample request set with placeholders.
- `ALEF-DELTA SACCO MANAGEMENT SYSTEM.pdf` – authoritative business specification.

## for single migration
npm run migrate:single <filename>
e.g npm run migrate:single 11_expand_account_products.sql
