# ALEF-DELTA SACCO - Frontend Architecture Guide

Comprehensive documentation of the Member Mini-App frontend architecture, design system, and development guidelines.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Folder Structure](#folder-structure)
3. [Design System](#design-system)
4. [Theme & Colors](#theme--colors)
5. [Typography](#typography)
6. [Spacing & Layout](#spacing--layout)
7. [Components](#components)
8. [State Management](#state-management)
9. [Routing](#routing)
10. [Internationalization](#internationalization)
11. [Performance Guidelines](#performance-guidelines)
12. [Accessibility](#accessibility)

---

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Vite** | Build tool & dev server | 5.x |
| **React** | UI framework | 18.x |
| **TypeScript** | Type safety | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Framer Motion** | Animations | 12.x |
| **Recharts** | Charts & sparklines | 3.x |
| **React Query** | Server state & caching | 5.x |
| **React Hook Form** | Form management | 7.x |
| **Zod** | Schema validation | 3.x |
| **React Router** | Client-side routing | 6.x |
| **React Icons** | Icon library | 5.x |
| **i18next** | Internationalization | 25.x |
| **Zustand** | Client state management | 5.x |

---

## Folder Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── AccountCard.tsx  # Account display card
│   ├── BottomNav.tsx    # Mobile bottom navigation
│   ├── KPIHeader.tsx    # Dashboard KPI section
│   ├── LoanCard.tsx     # Loan display card
│   ├── NavLink.tsx      # Navigation link component
│   ├── RequestForm.tsx  # Request creation modal
│   ├── StatusBadge.tsx  # Status indicator badge
│   └── TransactionRow.tsx # Transaction list item
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state & actions
│   ├── use-mobile.tsx   # Mobile detection hook
│   └── use-toast.ts     # Toast notifications hook
│
├── lib/                 # Utilities and configurations
│   ├── api.ts          # API client & mock data
│   ├── deeplink.ts     # Telegram deep link utilities
│   ├── i18n.ts         # i18n configuration
│   └── utils.ts        # General utilities (cn, etc.)
│
├── pages/              # Route pages
│   ├── auth/           # Authentication pages
│   │   ├── Login.tsx
│   │   └── RequestReset.tsx
│   ├── client/         # Member pages (authenticated)
│   │   ├── Accounts.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LoanDetail.tsx
│   │   ├── Loans.tsx
│   │   ├── Notifications.tsx
│   │   ├── Profile.tsx
│   │   ├── Requests.tsx
│   │   └── Transactions.tsx
│   ├── Index.tsx       # Landing page
│   └── NotFound.tsx    # 404 page
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All app types
│
├── App.tsx             # Root component with routing
├── index.css           # Global styles & design tokens
├── main.tsx            # Entry point
└── vite-env.d.ts       # Vite type declarations

docs/                   # Documentation
├── MOCK_DATA.md        # Mock data reference
├── FRONTEND_GUIDE.md   # This file
└── API_INTEGRATION.md  # API integration spec

public/                 # Static assets
├── favicon.ico
├── placeholder.svg
└── robots.txt
```

---

## Design System

### Color Palette (HSL Format)

All colors are defined using HSL values for consistency.

```css
/* Primary Colors - Deep Teal */
--primary: 192 91% 28%;          /* #0d6e7e - Main brand color */
--primary-foreground: 0 0% 98%;  /* White text on primary */

/* Accent Colors - Warm Gold */
--accent: 36 74% 58%;            /* #d4a84b - Highlight color */
--accent-foreground: 0 0% 13%;   /* Dark text on accent */

/* Semantic Colors */
--success: 142 71% 45%;          /* #22c55e - Success/positive */
--success-foreground: 0 0% 98%;
--warning: 38 92% 50%;           /* #f59e0b - Warning/attention */
--warning-foreground: 0 0% 13%;
--destructive: 0 84% 60%;        /* #ef4444 - Error/negative */
--destructive-foreground: 0 0% 98%;

/* Neutral Colors */
--background: 0 0% 100%;         /* White background */
--foreground: 222 47% 11%;       /* Dark text */
--card: 0 0% 100%;               /* Card background */
--card-foreground: 222 47% 11%;  /* Card text */
--muted: 210 40% 96%;            /* Muted background */
--muted-foreground: 215 16% 47%; /* Muted text */
--border: 214 32% 91%;           /* Border color */
--input: 214 32% 91%;            /* Input border */
--ring: 192 91% 28%;             /* Focus ring */
```

### Dark Mode Colors

```css
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 13%;
  --muted: 217 33% 17%;
  --border: 217 33% 17%;
  /* Primary & accent remain same */
}
```

---

## Typography

### Font Families

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-display: 'Space Grotesk', system-ui, sans-serif;
```

**Usage:**
- `font-sans` - Body text, UI elements
- `font-display` - Headings, KPI numbers, emphasis

### Font Sizes (Tailwind Scale)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Secondary text, metadata |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section headings |
| `text-3xl` | 30px | Page titles |
| `text-4xl` | 36px | KPI numbers |

### Font Weights

```css
font-normal: 400;   /* Body text */
font-medium: 500;   /* Emphasis */
font-semibold: 600; /* Headings */
font-bold: 700;     /* Strong emphasis */
```

---

## Spacing & Layout

### Spacing Scale

| Class | Value | Usage |
|-------|-------|-------|
| `p-1`, `m-1` | 4px | Tight spacing |
| `p-2`, `m-2` | 8px | Compact spacing |
| `p-3`, `m-3` | 12px | Default spacing |
| `p-4`, `m-4` | 16px | Standard spacing |
| `p-6`, `m-6` | 24px | Section spacing |
| `p-8`, `m-8` | 32px | Large spacing |

### Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Layout Guidelines

**Mobile (< 768px):**
- Single column layout
- Bottom navigation bar
- Full-width cards
- Stacked KPI items

**Tablet (768px - 1279px):**
- Two column layouts
- Side navigation option
- Card grid (2 columns)

**Desktop (≥ 1280px):**
- Multi-column layouts
- Sidebar navigation
- Card grid (3+ columns)
- Expanded data tables

---

## Components

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `KPIHeader` | Dashboard metrics with sparkline | `components/KPIHeader.tsx` |
| `AccountCard` | Account display with balance | `components/AccountCard.tsx` |
| `TransactionRow` | Expandable transaction item | `components/TransactionRow.tsx` |
| `LoanCard` | Loan summary with progress | `components/LoanCard.tsx` |
| `RequestForm` | Modal for creating requests | `components/RequestForm.tsx` |
| `StatusBadge` | Status indicator (Pending/Approved/etc) | `components/StatusBadge.tsx` |
| `BottomNav` | Mobile navigation bar | `components/BottomNav.tsx` |

### UI Components (shadcn/ui)

Located in `components/ui/`:
- `Button` - Action buttons with variants
- `Card` - Content containers
- `Dialog` - Modal dialogs
- `Input` - Form inputs
- `Select` - Dropdown selects
- `Toast` - Notifications
- `Skeleton` - Loading states
- And many more...

### Component Guidelines

1. **Props typing:** Always use TypeScript interfaces
2. **Composition:** Use shadcn patterns for composition
3. **Accessibility:** Include aria labels and keyboard support
4. **Responsive:** Mobile-first design approach
5. **Animation:** Use Framer Motion sparingly

---

## State Management

### Server State (React Query)

```typescript
// Fetching data
const { data, isLoading } = useQuery({
  queryKey: ['accounts'],
  queryFn: () => api.client.getAccounts(),
  staleTime: 30000, // 30 seconds
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => api.client.createRequest(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['requests']);
    toast.success('Request created!');
  },
});
```

### Client State (Zustand)

```typescript
// Auth store example
const useAuth = create((set) => ({
  member: null,
  isAuthenticated: false,
  login: (member) => set({ member, isAuthenticated: true }),
  logout: () => set({ member: null, isAuthenticated: false }),
}));
```

### Local Storage

Used for:
- JWT tokens (`accessToken`, `refreshToken`)
- User preferences
- Remember me functionality

---

## Routing

### Route Structure

```typescript
// Public routes
/                        → Landing/Sign-in chooser
/auth/login              → Phone + Password login
/auth/request-reset      → Password reset request

// Protected routes (require authentication)
/client/dashboard        → Member dashboard
/client/accounts         → Accounts list
/client/accounts/:id/transactions → Transaction history
/client/loans            → Loans list
/client/loans/:id        → Loan detail
/client/requests         → My requests
/client/profile          → Profile management
/client/notifications    → Notification center
```

### Deep Linking (Telegram Integration)

```
/miniapp?chat_id=<telegram_chat_id>&member_id=<member_id>
```

The `parseDeepLink()` utility extracts these parameters for backend validation.

---

## Internationalization

### Configuration

```typescript
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ... } },
    am: { translation: { ... } }, // Amharic
  },
  lng: 'en',
  fallbackLng: 'en',
});
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
}
```

### Translation Keys

All UI strings are externalized in `src/lib/i18n.ts` under the `translation` namespace.

---

## Performance Guidelines

### Code Splitting

```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/client/Dashboard'));
const Loans = lazy(() => import('./pages/client/Loans'));
```

### Image Optimization

- Use WebP format when possible
- Implement lazy loading for images
- Use appropriate image sizes

### Animation Performance

- Prefer CSS transitions over JS animations for simple effects
- Use `will-change` sparingly
- Animate `transform` and `opacity` only
- Use Framer Motion's `layout` prop cautiously

### React Query Caching

```typescript
// Configure stale times
staleTime: 30000,  // Data fresh for 30 seconds
cacheTime: 300000, // Cache for 5 minutes
```

---

## Accessibility

### Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Images have alt text
- [ ] Forms have proper labels
- [ ] Error messages are descriptive
- [ ] Loading states are announced
- [ ] Skip links provided

### ARIA Patterns

```tsx
// Button with loading state
<button aria-busy={isLoading} aria-disabled={isDisabled}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Form inputs
<label htmlFor="phone">Phone Number</label>
<input id="phone" aria-required="true" aria-invalid={!!error} />
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Environment Variables

```env
# .env.example
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=ALEF-DELTA SACCO
VITE_TELEGRAM_BOT_ID=optional_bot_id
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AccountCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `deeplink.ts` |
| Types | PascalCase | `Member`, `Account` |
| Pages | PascalCase | `Dashboard.tsx` |
| CSS | kebab-case | `index.css` |

---

## Git Conventions

### Branch Naming
- `feature/feature-name`
- `fix/bug-description`
- `refactor/area-name`

### Commit Messages
- `feat: add account card component`
- `fix: resolve transaction loading issue`
- `style: update color tokens`
- `refactor: extract KPI logic to hook`
