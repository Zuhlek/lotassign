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
LotAssignDB (IndexedDB)
├── auctions        (id, name, date)
├── lots            (id, auctionId, number)
├── bidders         (id, name, phone, languages[])
├── callers         (id, abbreviation, name, languages[])
├── auctionCallers  (id, auctionId, callerId)          // M:N junction
└── lotBidders      (id, auctionId, lotId, bidderId,   // Core assignment data
                     status, preferredCallerId, callerId)
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
│   ├── page.tsx                  # Home page with navigation
│   ├── auction/page.tsx          # Main auction management
│   ├── callers/page.tsx          # Caller management
│   └── backups/page.tsx          # Import/export functionality
│
├── components/
│   ├── layout/                   # Navigation components
│   │   ├── topbar.tsx
│   │   ├── top-bar-profile-icon.tsx
│   │   └── top-bar-title.tsx
│   ├── workflow/                 # Business logic components
│   │   ├── auctions-list.tsx
│   │   ├── lots-bidders-list.tsx
│   │   └── auction-callers-list.tsx
│   └── DataIntegrityChecker.tsx  # DB status monitor
│
├── lib/
│   ├── db/
│   │   └── dexie.db.ts           # Database schema definition
│   ├── models/                   # Data models with Zod validation
│   │   ├── auction.model.ts
│   │   ├── bidder.model.ts
│   │   ├── caller.model.ts
│   │   ├── lot.model.ts
│   │   ├── lot-bidder.model.ts
│   │   ├── auction-caller.model.ts
│   │   └── language.enum.ts
│   ├── actions/                  # CRUD operations
│   │   ├── auction.actions.ts
│   │   ├── bidder.actions.ts
│   │   ├── caller.actions.ts
│   │   ├── lot.actions.ts
│   │   ├── lot-bidder.actions.ts
│   │   ├── auction-caller.actions.ts
│   │   └── assignment-logic.actions.ts
│   ├── utils/
│   │   └── db-helpers.ts         # Import/export utilities
│   └── assignment.service.ts     # Core assignment algorithm
│
├── styles/
│   └── theme.ts                  # MUI theme customization
│
├── test/
│   └── assignment-service.test.ts
│
├── supply/                       # Sample data files
│   ├── callers.json
│   └── biddersPerLots.json
│
├── docu/                         # Documentation
│   └── ARCHITECTURE.md           # This file
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

### 4. Auto-Assignment Algorithm

Located in `lib/assignment.service.ts`, the algorithm:
- Matches callers to lot-bidders based on language compatibility
- Respects preferred caller assignments
- Balances workload across callers
- Enforces minimum lot gaps between different bidders for same caller
- Reports unschedulable assignments

### 5. Data Import/Export

- **Export**: Full database dump as JSON file
- **Import**: Restore database from JSON backup (replaces all data)
- **Clear**: Reset database to empty state

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
npm run test        # Run tests
npm run lint        # Check code quality
npm run export      # Build static export
```

## Browser Compatibility

The application requires a browser with IndexedDB support (all modern browsers).

## Data Privacy

All data remains in the user's browser:
- No data is sent to any server
- No cookies or tracking
- Export files stay on user's device
- Data does not sync between devices/browsers
