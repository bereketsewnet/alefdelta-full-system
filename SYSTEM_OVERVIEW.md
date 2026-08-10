# ALEF-DELTA SACCO Management System — System Overview

> **Audience:** SACCO owner / board / non-technical stakeholders
> **Purpose:** Single-source briefing document for understanding what was built, why it matters, and what it enables. Designed to be converted directly into presentation slides.

---

## 1. Executive Summary

ALEF-DELTA SACCO Management System is a **complete digital banking platform** purpose-built for a Savings and Credit Cooperative. It replaces manual ledgers, spreadsheets, and paper forms with three connected applications:

- A **Staff Portal** ("CoreBank") for daily operations by tellers, credit officers, managers, and admins.
- A **Member Portal** that members use from a normal web browser **or directly inside Telegram** as a Mini App.
- A **Backend API** that holds the business rules, the database, and the security model.

The system is live in production, runs on a single VPS using Docker, is reachable over three secure HTTPS domains, and is ready for member onboarding.

---

## 2. Why This System Exists

**Problems with traditional SACCO operations:**
- Member records scattered across paper files and spreadsheets.
- Loan approvals slow because affordability rules are checked by hand.
- Cash transactions difficult to audit; risk of human error or duplication.
- Members must walk into the office for every balance check, deposit request, or loan inquiry.
- No real-time reporting for management.

**What this system delivers:**
- Single source of truth for members, accounts, loans, and money movements.
- Automated enforcement of SACCO business rules (e.g., the **1/3 rule**, affordability, gatekeeper checks).
- 24/7 self-service for members via web and Telegram.
- Full audit trail for every approval and every cash movement.
- Reports and dashboards available instantly to management.

---

## 3. System at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                  ALEF-DELTA SACCO Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   STAFF              MEMBERS              MEMBERS               │
│   (browser)          (browser)            (Telegram)            │
│      │                  │                     │                 │
│      ▼                  ▼                     ▼                 │
│  ┌─────────┐       ┌─────────┐         ┌──────────┐             │
│  │CoreBank │       │ Member  │ ◀────── │ Telegram │             │
│  │ Portal  │       │ Portal  │  same   │ Mini App │             │
│  └────┬────┘       └────┬────┘   app   └────┬─────┘             │
│       │                 │                   │                   │
│       └──────────┬──────┴───────────────────┘                   │
│                  ▼                                              │
│            ┌──────────┐         ┌─────────────┐                 │
│            │ Backend  │ ◀─────▶ │ Telegram    │                 │
│            │   API    │  push   │ Bot         │                 │
│            └────┬─────┘  notif. └─────────────┘                 │
│                 ▼                                               │
│           ┌──────────┐                                          │
│           │  MySQL   │                                          │
│           │ Database │                                          │
│           └──────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

All three apps talk to the same backend, which is the only thing that talks to the database. A reverse proxy (Caddy) handles HTTPS for the three public domains and routes traffic to the right app.

---

## 4. The Three Pillars

### 4.1 CoreBank — Staff Portal
**URL:** https://corebank.alefdelta.com
**Users:** Admin, Manager, Teller, Credit Officer, Auditor
**Purpose:** The day-to-day cockpit for everyone inside the SACCO.

**What staff can do here:**
- Register and verify new members (KYC, ID upload, profile photo)
- Open and manage savings, share-capital, and other accounts
- Process deposits and withdrawals at the counter
- Receive deposit requests from members and approve them
- Create loan applications with guarantors and collateral
- Approve, reject, or escalate loan applications
- Apply repayments and run repayment schedules
- Generate end-of-day reports
- View audit logs of every action

---

### 4.2 Member Portal — Web Browser & Telegram Mini App
**URL:** https://sacco-mp.alefdelta.com
**Also accessible inside:** Telegram (as a Mini App attached to the SACCO bot)
**Users:** SACCO members

**What members can do — anytime, from anywhere:**
- Log in with phone number + password
- View account balances (savings, share capital, fixed deposits)
- See full transaction history
- Submit a deposit request (with receipt photo upload) for staff to confirm
- Apply for a loan and track its approval status
- View loan repayment schedule and remaining balance
- Make repayment requests with proof of payment
- Update profile, manage beneficiaries, register emergency contacts
- Receive notifications about approvals, balances, or due dates

**Why the Telegram Mini App matters:**
- Members in Ethiopia who already use Telegram daily don't need to install a separate app.
- The Mini App opens **inside Telegram** with one tap — no app store, no APK download.
- It's the same React app served from the web — one codebase, two access channels.
- The Telegram bot can push notifications (loan approved, deposit confirmed) directly into the member's chat.

---

### 4.3 Backend API
**URL:** https://sacco-api.alefdelta.com (internal API, not browsed directly)
**Purpose:** The brain. Holds all business rules and is the only system that touches the database.

**What the backend guarantees:**
- Every money movement runs inside a database transaction so balances can never end up half-updated.
- Optimistic locking on account balances prevents double-withdrawals when two staff act at the same time.
- Idempotency keys prevent duplicate deposits if a network call retries.
- Every approval, transaction, and money movement is written to an immutable audit log.
- Role-based access control: a Teller cannot approve loans; a Credit Officer cannot process withdrawals.
- File uploads (IDs, receipts, collateral docs) are validated for type and stored per-entity.

---

## 5. Feature Catalog by Domain

### 5.1 Members & KYC
- Full member profile (name, gender, marital status, address, income, TIN)
- ID card upload (front & back)
- Profile photo
- Emergency contacts
- Beneficiaries with their own ID uploads
- Member status lifecycle: Pending → Active → Suspended / Closed
- Member registration **requests** flow (member self-registers, staff approves)

### 5.2 Accounts & Savings Products
The system ships with **7 built-in account product types**:

| Code | Product |
| --- | --- |
| `SAV_COMPULSORY` | Compulsory savings |
| `SAV_VOLUNTARY` | Voluntary savings |
| `SAV_FIXED` | Fixed-term deposit |
| `SAV_CHILD` | Children's savings |
| `SAV_MICRO` | Micro savings |
| `SAV_IN_KIND` | In-kind savings |
| `SHR_CAP` | Share capital |

Full account lifecycle: create → freeze/unfreeze → close. Lien management is built in so balances tied to active loans cannot be withdrawn.

### 5.3 Loan Products (10 built-in)

| Code | Product | Type | Interest |
| --- | --- | --- | --- |
| `L-EDU` | Education Loan | FLAT | 12.5% |
| `L-MED` | Medical Loan | FLAT | 12.5% |
| `L-SOC` | Social Event Loan | FLAT | 12.5% |
| `L-INS` | Insurance Loan | FLAT | 12.5% |
| `L-HSE` | Home Construction | FLAT | 17.0% |
| `L-VEH` | Vehicle Purchase | FLAT | 14.0% |
| `L-BIZ` | Business Expansion | DECLINING | 14.0% |
| `L-AGR` | Urban Agriculture | DECLINING | 14.0% |
| `SAV_STANDARD` | Standard Loan | FLAT | 12.5% |
| `DEV_GROWTH` | Growth / Development Loan | DECLINING | 16.0% |

Two interest models are supported out of the box: **flat rate** and **declining balance**.

### 5.4 Loan Lifecycle (the rules the system enforces)
1. **Application** — by member (self-service) or by staff on the member's behalf
2. **Gatekeeper checks** — verify member status, savings balance, existing loans
3. **Affordability check** — monthly installment vs. monthly income
4. **1/3 rule** — total monthly loan deductions cannot exceed 1/3 of income
5. **Schedule preview** — show repayment schedule before approval
6. **Guarantors & collateral** — attach, with ID/document uploads
7. **Approval workflow** — Credit Officer prepares → Manager / Admin approves
8. **Lien creation** — savings lien is automatically placed when loan is approved
9. **Disbursement** — funds released, recorded as transaction
10. **Repayment** — schedule-based, supports quarterly & flexible frequencies
11. **Penalty processing** — automated daily job applies overdue penalties

### 5.5 Transactions
- Deposit, withdrawal, internal transfer, loan disbursement, loan repayment
- Every transaction carries: amount, currency (ETB), idempotency key, performed-by, receipt URL, audit row
- Receipt photos stored under `uploads/transactions/{account}`
- Concurrency-safe: optimistic locking on the `accounts.version` column

### 5.6 Approvals Workflow
Members can **request** actions that staff must **approve**, creating a clean two-sided workflow:
- Deposit requests (member uploads receipt → Teller/Accountant approves)
- Loan repayment requests (member uploads receipt → Teller/Accountant approves)
- Loan applications (Credit Officer prepares → Manager/Admin approves)
- Member registration requests (member self-registers → Teller/Manager approves)

### 5.7 Notifications
- Backend pushes approved notifications to the Telegram bot via a secure webhook
- Bot delivers messages to the member's Telegram chat
- Triggered by: loan approval, deposit confirmation, repayment due, balance alerts

### 5.8 Reports & Analytics
Reports available to staff (filtered by role):
- Daily transaction summary
- End-of-day cash reconciliation
- Outstanding loan balances
- Overdue loans
- Member account statements
- Interest postings
- Penalty applications
- Audit log exports

### 5.9 Automated Background Jobs (run daily)
- **Penalty processing** — applies penalty interest to overdue loans
- **Interest posting** — credits monthly interest to eligible savings accounts
- **Member lifecycle** — updates member status based on activity

---

## 6. User Roles (currently active)

| Role | Who | Main Powers |
| --- | --- | --- |
| **MEMBER** | SACCO members | View own data, request deposits, request loans, request repayments |
| **TELLER** | Front-desk staff | Process cash, register members, approve deposit/repayment requests |
| **CREDIT_OFFICER** | Loan team | Create loan applications, add guarantors & collateral, check eligibility |
| **MANAGER** | Operations head | Approve loans, activate members, all transaction processing |
| **ADMIN** | System owner | Everything: system config, user mgmt, EOD, interest processing |
| **AUDITOR** | Compliance | Read-only access to all transactions and reports |

**Planned roles** (documented in `ROLE_RESPONSIBILITIES.md`, ready to add):
- ACCOUNTANT and ACCOUNTANT_HEAD for financial reconciliation
- COMPLIANCE_OFFICER for regulatory oversight
- IT_ADMIN, BRANCH_MANAGER, LOAN_OFFICER for future scale

---

## 7. Security & Trust

- **HTTPS everywhere** — automatic Let's Encrypt certificates on all 3 domains, renewed automatically.
- **Authentication** — JWT access tokens + refresh tokens; staff use username/password, members use phone/password.
- **Password security** — bcrypt hashing (12 rounds); plaintext passwords are never stored or logged.
- **OTP password reset** — email-based one-time codes with configurable expiry.
- **Rate limiting** — login endpoints throttled to block brute-force attempts.
- **Role-based access control** — enforced in middleware on every protected endpoint.
- **Audit logging** — every approval and money-moving action writes a permanent audit row.
- **Optimistic locking** — prevents two staff from updating the same account at the same time.
- **Idempotency keys** — deposits/withdrawals can be safely retried without double-processing.
- **File upload validation** — MIME type checks, per-entity folders, no path traversal.
- **Database isolation** — MySQL is **not** reachable from the public internet; only the backend container can talk to it.
- **Bot token authentication** — backend ↔ bot webhook is protected by a shared secret.

---

## 8. Technology Stack

| Layer | Technology |
| --- | --- |
| Staff Portal (CoreBank) | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Member Portal | React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Telegram Web App SDK |
| Backend API | Node.js 20 + Express |
| Database | MySQL 8.0 with raw SQL migrations (32 migrations applied) |
| Telegram Bot | Python + aiogram v3 (async) |
| API Documentation | OpenAPI 3 + Swagger UI + Postman collection |
| Testing | Jest (unit + integration) — covers loan calculations, idempotency, locking, concurrent withdrawals |
| Logging | Winston |
| Reverse proxy / TLS | Caddy 2 (automatic Let's Encrypt) |
| Containerization | Docker + Docker Compose |

---

## 9. Production Deployment Architecture

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   Caddy proxy   │  ports 80, 443  (Let's Encrypt auto-SSL)
              └────────┬────────┘
                       │ internal Docker network only
      ┌────────────────┼─────────────────┐
      ▼                ▼                 ▼
  CoreBank        Member Portal      Backend API
  (frontend)      (member_portal)    (api)
                                          │
                                          ▼
                                     ┌────────┐
                                     │ MySQL  │ (internal only)
                                     └────────┘
```

- **One VPS** (AWS, Stockholm region) hosts the entire stack.
- **Only ports 80 and 443 are open** to the public internet.
- The API, frontend, member portal, and database are reachable **only** through the internal Docker network.
- Caddy terminates HTTPS and routes each domain to its container.
- Database backups taken via `mysqldump` from inside the MySQL container.
- Files (member IDs, receipts, collateral docs) persisted on the host filesystem and bind-mounted into the API container.

---

## 10. Live Production URLs

| Service | URL | Purpose |
| --- | --- | --- |
| **CoreBank Staff Portal** | https://corebank.alefdelta.com | Staff daily operations |
| **Member Portal** | https://sacco-mp.alefdelta.com | Member self-service (also opens inside Telegram) |
| **Backend API** | https://sacco-api.alefdelta.com | Internal API (Swagger at `/api-docs`) |

---

## 11. Operational Strengths (talking points for the owner)

- **Always-on access.** Members reach their accounts 24/7 from a browser or directly from Telegram.
- **Faster service.** Deposits, withdrawals, and loan checks that took minutes by paper happen in seconds.
- **No data loss risk.** Every action is transactional, audited, and recoverable from backup.
- **Built for Ethiopian context.** Currency in ETB, phone numbers in `+251` format, Telegram-first mobile delivery, support for both flat and declining-balance loan interest models common in local SACCOs.
- **Compliance-ready.** Audit logs, KYC documentation storage, role-based separation of duties, OTP-based password recovery.
- **Scales without rewrite.** Containerized; can move to a bigger VPS, a managed database, or multiple branches with no code change.
- **Vendor-independent.** All open-source components — no per-seat license fees.

---

## 12. What's Next (Roadmap)

**Short term**
- Onboard the first cohort of members
- Train staff on each role (separate manual exists)
- Configure SMS provider for non-Telegram notifications
- Schedule first weekly database backup

**Medium term**
- Add **ACCOUNTANT** and **ACCOUNTANT_HEAD** roles (already designed)
- Enable Telegram Mini App officially with the SACCO's bot button
- Add member-facing dashboards (savings growth charts, loan progress)
- Integrate with mobile money / bank API for direct disbursement

**Long term**
- Multi-branch support (BRANCH_MANAGER role already designed)
- Compliance reporting export for regulators
- Mobile app wrappers (iOS + Android) if needed beyond Telegram

---

## 13. Quick Reference (for the slide notes)

- **Number of system modules:** 25 (auth, members, accounts, loans, transactions, approvals, notifications, reports, etc.)
- **Number of database tables:** 24
- **Database migrations applied:** 32
- **Built-in account product types:** 7
- **Built-in loan product types:** 10
- **Active user roles:** 6 (with 6 more designed and ready)
- **Public-facing ports:** 2 (HTTP and HTTPS only)
- **HTTPS certificates:** 3, auto-renewed by Caddy

---

---

## 14. Presentation Design Brief

> **Use this section as the design specification when generating the PowerPoint.** It locks the deck to the same visual identity as the production CoreBank application (`alef-delta-hub/src/index.css`), so the presentation feels like a natural extension of the product.

### 14.1 Design Direction (one sentence)

> **"Modern, elegant, animated, abstract — a fintech-grade deck that signals trust through deep teal, warmth through gold, and confidence through generous whitespace and subtle motion."**

The slides should feel like the inside of a premium private bank app — restrained, precise, with motion used to guide the eye rather than to entertain.

### 14.2 Master Color Palette (locked to the CoreBank website)

These are the exact tokens from `alef-delta-hub/src/index.css`, with HEX equivalents for use in PowerPoint's color picker.

#### Light theme (use for most slides)

| Role | HSL (from CSS) | HEX | Use for |
| --- | --- | --- | --- |
| **Primary — Deep Teal** | `hsl(182, 62%, 18%)` | `#11494A` | Title bars, key icons, hero headings, sidebar fills |
| Primary Hover | `hsl(182, 62%, 25%)` | `#1A6266` | Hover/active states in diagrams |
| **Accent — Warm Gold** | `hsl(45, 65%, 52%)` | `#D4AC35` | Highlights, key numbers, CTA buttons, underlines |
| Accent Light | `hsl(45, 70%, 92%)` | `#F8EED2` | Soft highlight backgrounds, tinted cards |
| Background | `hsl(0, 0%, 100%)` | `#FFFFFF` | Default slide background |
| Foreground (body text) | `hsl(180, 45%, 15%)` | `#153838` | All body and label text |
| Muted text | `hsl(210, 10%, 45%)` | `#6B7280` | Captions, footnotes, secondary labels |
| Muted background | `hsl(210, 15%, 96%)` | `#F1F3F5` | Section dividers, code blocks, soft cards |
| Border | `hsl(210, 15%, 88%)` | `#DCDFE3` | Thin dividers, table grid lines |

#### Status colors (use sparingly, only for badges & status indicators)

| Role | HEX | Use |
| --- | --- | --- |
| Success Green | `#22C55E` | "Approved", "Active", positive numbers |
| Warning Amber | `#F59E0B` | "Pending", "Review" |
| Destructive Red | `#EF4444` | "Rejected", "Overdue", negative numbers |
| Info Blue | `#0EA5E9` | "Notification", neutral info badges |

#### Dark theme (use for the cover slide, section dividers, and the closing slide for contrast)

| Role | HEX | Use |
| --- | --- | --- |
| Background | `#0B1E1E` | Full-bleed dark slide background |
| Card surface | `#142929` | Floating cards on dark background |
| Primary (lifted) | `#22A2A8` | Headings and icons on dark surfaces |
| Accent gold | `#D4AC35` | Unchanged — gold reads beautifully on dark teal |

### 14.3 Signature Gradients (from the CSS — recreate these exactly)

- **Primary gradient:** linear, 135°, `#11494A → #1A6F73`. Use behind hero titles and on the cover slide.
- **Accent gradient:** linear, 135°, `#D4AC35 → #E0BF55`. Use for the single most important number on a slide.
- **Success gradient:** linear, 135°, `#22C55E → #4ADE80`. Use for charts showing growth.

### 14.4 Typography

| Slot | Suggested font (PowerPoint-safe) | Weight | Notes |
| --- | --- | --- | --- |
| Display / Hero | **Inter** or **Manrope** | 700 | Large, tight letter-spacing (-1 to -2 px) |
| Section title | Inter | 600 | Generous line height (1.3) |
| Body | Inter | 400 | 18–22 pt for readability on screen |
| Numbers / Data | **JetBrains Mono** or any tabular-nums font | 500 | Matches the website's `numeric-display` class |
| Footnote / Caption | Inter | 400, smaller, muted color | |

If Inter isn't installed: fallback to **Segoe UI** (universal on Windows) or **SF Pro Display** (Mac).

### 14.5 Animation & Motion Direction

Use motion to **introduce information progressively**, never to decorate. The CSS already defines the easing curves to match:

- Base transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)` (snappy, for state changes)
- Smooth transition: `300ms cubic-bezier(0.4, 0, 0.2, 1)` (graceful, for entrances)

**Per-slide motion recipe:**

1. **Slide entrance** — fade + slide-up 12 px, 400 ms ease-out
2. **Bullet appearance** — fade + slide-up 6 px, 200 ms each, staggered 100 ms
3. **Numbers / KPIs** — count-up animation, 800 ms ease-out
4. **Icons & diagrams** — scale from 0.95 → 1.0 with fade, 300 ms
5. **Section divider transitions** — full-screen wipe in primary teal (`#11494A`)
6. **Card hover (if interactive)** — translate-y(-2 px) + shadow, matches `.hover-lift` from the CSS

**Avoid:** bouncy elastic effects, spinning entrances, "fly-in from edge", anything that screams "PowerPoint 2007".

### 14.6 Abstract Visual Motifs (no stock photos)

Build a small library of **abstract decorative elements** and reuse them throughout the deck. None of these should ever upstage the content.

- **Soft gradient orbs** — large, blurred circles (radial gradient teal → transparent), placed behind hero headings at 15–25 % opacity
- **Geometric line meshes** — thin (1 px) gold lines forming triangular/hex meshes in slide corners
- **Concentric arcs** — partial circles in primary teal, opacity 8–12 %, evoking financial growth charts without being literal
- **Floating cards with glass-morphism** — `rgba(255, 255, 255, 0.7)` + `backdrop-blur(12px)`, matching the `.card-glass` utility
- **Gold underline accent** — 2 px gold line under section titles, animated to draw in from the left on entrance
- **Number callouts** — large 96–144 pt numerals in the gold gradient, with a tiny teal caption below

**Iconography:** use **Lucide** or **Phosphor** outline icons (1.5 px stroke), all in primary teal. Never use mixed icon styles or filled+outline together.

### 14.7 Slide Layout Patterns (reusable templates)

Use these five layouts throughout — don't invent new ones per slide.

1. **Cover** — full-bleed dark teal background, hero title in white with gold underline, soft gradient orb top-right, small "ALEF-DELTA SACCO" wordmark bottom-left.
2. **Section divider** — full-bleed teal, large white section number (`01`, `02`...) in light weight, section title below, gold accent line.
3. **Two-column content** — white background, headline + 3–5 bullets on the left, single illustrative diagram/icon on the right.
4. **KPI / number focus** — white background, one huge gold-gradient number centered, one-line teal caption above, muted footnote below.
5. **Table / matrix** — white background, headers in teal, alternating row background `#FFFFFF` / `#F8EED2` (accent light), gold bottom-border on the header row.

### 14.8 Slide-by-Slide Treatment Plan

Map this directly to the deck. Suggested order = 14 slides, ~15-minute talk.

| # | Slide | Section ref | Layout | Visual highlight |
| --- | --- | --- | --- | --- |
| 1 | Cover | — | Cover | Hero title "ALEF-DELTA SACCO Management System" + gold underline draw-in |
| 2 | Why this exists | §2 | Two-column | Left: problem bullets in muted; right: gold checkmark stack |
| 3 | System at a glance | §3 | Two-column | Right: animated build-up of the 3-pillar diagram |
| 4 | CoreBank Staff Portal | §4.1 | Two-column | Right: stylized desktop frame screenshot mockup |
| 5 | Member Portal (Web + Telegram) | §4.2 | Two-column | Right: two phone mockups side-by-side, one labeled "Web", one "Telegram" |
| 6 | Backend & data integrity | §4.3 | Two-column | Right: concentric arcs diagram representing transactions & audit |
| 7 | Feature catalog | §5 | Table | 7 rows for the 7 domains, with one icon each |
| 8 | Loan & savings products | §5.2 + §5.3 | KPI | Big numbers: **10** loan products, **7** account products |
| 9 | Loan lifecycle | §5.4 | Two-column | Right: 11-step vertical timeline in teal/gold |
| 10 | Roles & permissions | §6 | Table | The 6 active roles as the matrix; planned roles below in muted |
| 11 | Security & trust | §7 | Two-column | Right: 5–6 gold lock/shield icons in a grid |
| 12 | Technology stack | §8 | Two-column | Right: tech logos at 60% opacity in a 3×3 grid |
| 13 | Deployment & live URLs | §9 + §10 | Two-column | Right: simplified Caddy + 3-container diagram |
| 14 | Closing / Roadmap | §11 + §12 | Section divider on dark teal | Hero text "Live. Trusted. Ready to scale." in white, gold underline |

### 14.9 Brand Voice for the Speaker Notes

Short, declarative sentences. Numbers over adjectives. Owner-friendly, never engineer-y.

- ✅ **Good:** "Members can check their balance at 2 a.m. from inside Telegram. The old way required a 9-to-5 visit to the office."
- ❌ **Avoid:** "The system leverages a microservices-style architecture with optimistic concurrency control to enable real-time data access patterns."

### 14.10 What NOT to Do

- ❌ No clip art, no emoji clusters, no stock-photo people pointing at laptops
- ❌ No more than **two** colors on any single slide besides white/teal/gold
- ❌ No more than **5 bullets** per slide
- ❌ No animated GIFs, no autoplay videos, no sound effects
- ❌ No screenshots with private member data — use **mocked** data only
- ❌ No "wall of text" — if a slide has more than 60 words, split it
- ❌ Never mix the gold accent with red destructive on the same slide (clashes)

### 14.11 Asset Production Checklist

Before exporting the deck:

- [ ] All colors picked from the HEX values in §14.2 (verify with PowerPoint's eyedropper)
- [ ] Gold accent appears on every slide, even if minimally (consistency anchor)
- [ ] Fonts embedded in the .pptx so the deck renders correctly on other machines
- [ ] All animations preview cleanly at 400 ms or less
- [ ] No raster images below 200 dpi (use SVG / vector wherever possible)
- [ ] Dark slides (cover, section dividers, closing) use the `#0B1E1E` background, not pure black
- [ ] Page numbers in muted gray bottom-right, hidden on cover and dividers
- [ ] Final slide has the live production URL `https://corebank.alefdelta.com` and the owner's contact

---

**Document prepared for:** ALEF-DELTA SACCO leadership briefing
**System status:** ✅ Live in production
**Live since:** May 2026
**Visual identity reference:** `alef-delta-hub/src/index.css` (locked palette)
