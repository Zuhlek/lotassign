# LotAssign - Architecture Documentation

## Overview

LotAssign is a client-side web application for managing auction lot assignments and caller scheduling. The application runs entirely in the browser with no backend server - all data is stored locally in IndexedDB.

## Purpose

The application helps coordinate:
- **Auction management**: Create and manage auctions with lots
- **Bidder tracking**: Track bidders and their language preferences
- **Caller assignment**: Intelligently assign callers (auctioneers) to lot-bidder combinations based on language compatibility and scheduling constraints
- **Data persistence**: Export/import all data as JSON for backup and transfer

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (Static Export) | React framework with file-based routing |
| UI | React 19 | Component-based UI library |
| Styling | Material-UI (MUI) 7 | Component library and theming |
| CSS-in-JS | Emotion | Styling solution for MUI |
| Database | Dexie (IndexedDB) | Client-side database storage |
| Validation | Zod | Runtime schema validation |
| File Handling | ExcelJS, file-saver | Excel import and file downloads |
| Language | TypeScript | Type-safe JavaScript |

## Data Architecture

### Storage Strategy

All data is stored in the browser's **IndexedDB** via Dexie.js. This means:
- Data persists across browser sessions
- No server-side storage or sync
- Users can export/import data as JSON files
- Data is isolated per browser/device

### Database Schema

```
LotAssignDB (IndexedDB) v4
├── auctions        (id, name, date, createdAt, updatedAt)
├── lots            (id, auctionId, number, title, createdAt, updatedAt)
├── bidders         (id, name, phone, languages[], createdAt, updatedAt)
├── callers         (id, abbreviation, name, languages[], createdAt, updatedAt)
├── auctionCallers  (id, auctionId, callerId, createdAt, updatedAt)
├── lotBidders      (id, auctionId, lotId, bidderId, status, preferredCallerId, createdAt, updatedAt)
├── assignments     (id, auctionId, lotBidderId, callerId, status, source, createdAt, updatedAt)  // NEW v3
└── auctionConfigs  (id, auctionId, lotGap, prioritizePreferences, allowLanguageFallback, balanceWorkload)  // NEW v4
```

### Entity Relationships

```
Auction (1) ─────────────────── (*) Lot
    │                              │
    │                              │
    └── (*) AuctionCaller ──── (*) Caller
                                   │
                                   │
Bidder (*) ─── LotBidder ─────────┘
           (status, preferredCallerId, callerId)
```

### LotBidder Status Flow

```
Created → Planned → Assigned → Final
```

## Project Structure

```
lotassign/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with MUI theme
│   ├── page.tsx                  # Home page with workflow guide
│   ├── auction/page.tsx          # Main auction management
│   ├── callers/page.tsx          # Caller management
│   └── backups/page.tsx          # Import/export/demo data
│
├── components/
│   ├── layout/                   # Navigation components
│   │   ├── topbar.tsx            # Main navigation bar
│   │   ├── top-bar-profile-icon.tsx
│   │   └── top-bar-title.tsx
│   ├── workflow/                 # Business logic components
│   │   ├── auctions-list.tsx
│   │   ├── lots-bidders-list.tsx
│   │   ├── auction-callers-list.tsx
│   │   └── auction-config.tsx    # Algorithm settings panel
│   └── DataIntegrityChecker.tsx  # DB status monitor
│
├── lib/
│   ├── db/
│   │   ├── dexie.db.ts           # Database schema (v4)
│   │   └── migrations/           # DB version migrations
│   │       └── migration-v4.ts
│   ├── models/                   # Data models with Zod validation
│   │   ├── auction.model.ts
│   │   ├── bidder.model.ts
│   │   ├── caller.model.ts
│   │   ├── lot.model.ts
│   │   ├── lot-bidder.model.ts
│   │   ├── auction-caller.model.ts
│   │   ├── assignment.model.ts   # Assignment persistence
│   │   ├── auction-config.model.ts # Per-auction config
│   │   └── language.enum.ts
│   ├── actions/                  # CRUD operations
│   │   ├── auction.actions.ts
│   │   ├── bidder.actions.ts
│   │   ├── caller.actions.ts
│   │   ├── lot.actions.ts
│   │   ├── lot-bidder.actions.ts
│   │   ├── auction-caller.actions.ts
│   │   ├── assignment.actions.ts
│   │   ├── auction-config.actions.ts
│   │   └── assignment-logic.actions.ts
│   ├── algorithm/                # CSP Solver (NEW)
│   │   ├── constraints.ts        # Constraint definitions
│   │   ├── csp-solver.ts         # Main solver algorithm
│   │   └── preview.ts            # Preview before applying
│   ├── utils/
│   │   ├── db-helpers.ts         # Import/export utilities
│   │   └── demo-data.ts          # Demo auction generator
│   └── assignment.service.ts     # Assignment service (legacy + CSP)
│
├── styles/
│   └── theme.ts                  # MUI theme customization
│
├── test/
│   ├── assignment-service.test.ts
│   └── algorithm-benchmark.test.ts # CSP vs legacy comparison
│
├── supply/                       # Sample data files
│   ├── callers.json
│   └── biddersPerLots.json
│
├── docu/                         # Documentation
│   ├── ARCHITECTURE.md           # This file
│   └── DEPLOYMENT.md             # Deployment guide
│
└── .github/workflows/
    └── deploy.yml                # GitHub Pages deployment
```

## Core Features

### 1. Auction Management

- Create/edit/delete auctions with name and date
- Select auction to view and manage its lots and bidders

### 2. Lot & Bidder Management

- Import lots and bidders from JSON
- Track bidder language preferences
- Assign bidders to lots with status tracking

### 3. Caller Management

- Create callers with name, abbreviation, and language capabilities
- Import callers from Excel files (headers: Name, Kürzel, Sprachen)
- Assign callers to auctions

### 4. Auto-Assignment Algorithm (CSP Solver)

Located in `lib/algorithm/csp-solver.ts`, the new Constraint Satisfaction Problem (CSP) solver:

**Hard Constraints** (must be satisfied):
- Language compatibility between caller and bidder
- Temporal constraint: minimum lot gap between different bidders for same caller

**Soft Constraints** (optimized when possible):
- Preferred caller assignments
- Workload balancing across callers
- Caller continuity (same caller for consecutive lots of same bidder)

**Algorithm Flow**:
1. Process lot-bidder pairs in lot number order
2. For each pair, find all callers that satisfy hard constraints
3. Score candidates based on soft constraints
4. Select highest-scoring caller
5. Track assignments for temporal constraint checking

**Configuration** (per-auction via AuctionConfig):
- `lotGap`: Minimum lots between different bidders for same caller (1-20)
- `prioritizePreferences`: Honor caller-bidder preferences when possible
- `allowLanguageFallback`: Assign callers even without perfect language match
- `balanceWorkload`: Distribute assignments evenly across callers

**Performance**: CSP solver achieves ~100% assignment rate vs legacy algorithm's ~25%

The legacy algorithm remains available in `lib/assignment.service.ts` for backwards compatibility.

### 5. Data Import/Export

- **Export**: Full database dump as JSON file
- **Import**: Restore database from JSON backup (replaces all data)
- **Clear**: Reset database to empty state
- **Demo Data**: Load a comprehensive demo auction to test all features

### 6. Demo Data

Available via Data Management page, the demo auction includes:

- **10 Callers**: Various language combinations (German, English, French, Italian, Spanish)
- **15 Bidders**: Different language requirements including rare languages
- **25 Lots**: Spread across lot numbers 1-50 with realistic gaps

**Edge Cases Demonstrated**:
1. Same bidder on consecutive lots (5, 6, 7) - tests caller continuity
2. Multiple bidders on same lot (lot 10) - tests concurrent caller needs
3. Bidder with rare language (Italian only) - tests language fallback
4. High-density period (lots 15-20) - tests load balancing
5. Preferred caller assignments - tests preference prioritization

## Supported Languages

```typescript
enum Language {
  Deutsch = "D",
  Englisch = "E",
  Italienisch = "I",
  Spanisch = "S",
  Französisch = "F",
  Niederländisch = "N",
  Chinesisch = "Chin.",
  Japanisch = "Jap",
  Russisch = "R"
}
```

## Deployment

### GitHub Pages (Static Export)

The application is configured for static export and GitHub Pages deployment:

1. **Build**: `npm run build` generates static files in `/out`
2. **Deploy**: GitHub Actions automatically deploys on push to `main`

### Configuration

In `next.config.mjs`:
- `output: 'export'` - Enables static HTML export
- `trailingSlash: true` - Helps with GitHub Pages routing
- `images: { unoptimized: true }` - Required for static export

### Manual Deployment

```bash
npm run export      # Build and add .nojekyll
# Upload /out folder to any static hosting
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Commands

```bash
npm install         # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run test        # Run tests (21 tests across 2 suites)
npm run lint        # Check code quality
npm run export      # Build static export
```

### Test Suites

- **assignment-service.test.ts**: Core assignment logic tests
- **algorithm-benchmark.test.ts**: CSP vs legacy algorithm performance comparison

## Browser Compatibility

The application requires a browser with IndexedDB support (all modern browsers).

## Data Privacy

All data remains in the user's browser:
- No data is sent to any server
- No cookies or tracking
- Export files stay on user's device
- Data does not sync between devices/browsers
