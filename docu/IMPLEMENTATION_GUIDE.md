# LotAssign - Detailed Implementation Guide

This document provides step-by-step implementation instructions for each phase of the refactoring plan. Each task includes specific file changes, code examples, and acceptance criteria.

---

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation)
2. [Phase 2: Algorithm](#phase-2-algorithm)
3. [Phase 3: UI Overhaul](#phase-3-ui-overhaul)
4. [Phase 4: Polish & Deploy](#phase-4-polish--deploy)

---

## Phase 1: Foundation

**Duration**: 1-2 weeks
**Goal**: Stabilize data model, improve type safety, prepare for algorithm work

---

### Task 1.1: Enable TypeScript Strict Mode

**Files to modify**:
- `tsconfig.json`

**Changes**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

**Follow-up tasks**:
- Fix all resulting TypeScript errors (expect 20-50 errors)
- Common fixes needed:
  - Add `!` assertions or null checks for Map.get() calls
  - Add explicit return types to functions
  - Handle undefined cases in array access

**Acceptance criteria**:
- [ ] `npm run build` passes with no type errors
- [ ] `npm run lint` passes

---

### Task 1.2: Add Timestamps to All Models

**Files to modify**:
- `lib/models/auction.model.ts`
- `lib/models/bidder.model.ts`
- `lib/models/caller.model.ts`
- `lib/models/lot.model.ts`
- `lib/models/lot-bidder.model.ts`
- `lib/models/auction-caller.model.ts`
- `lib/db/dexie.db.ts`

**Example change for `auction.model.ts`**:
```typescript
import { z } from "zod";

export class Auction {
  id?: number;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    date: Date,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.name = name;
    this.date = date;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AuctionJSON): Auction {
    const parsed = AuctionSchema.parse(json);
    return new Auction(
      parsed.name,
      new Date(parsed.date),
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AuctionJSON {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const AuctionSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  date: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AuctionJSON {
  id?: number;
  name: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}
```

**Database schema update in `dexie.db.ts`**:
```typescript
this.version(2).stores({
  auctions:       "++id, name, date, createdAt, updatedAt",
  lots:           "++id, auctionId, number, [auctionId+number], createdAt",
  bidders:        "++id, name, phone, *languages, createdAt",
  callers:        "++id, abbreviation, name, *languages, createdAt",
  auctionCallers: "++id, auctionId, callerId, [auctionId+callerId], createdAt",
  lotBidders:     "++id, auctionId, lotId, bidderId, preferredCallerId, callerId, status, [lotId+bidderId], [auctionId+status], [callerId+lotId], createdAt",
});
```

**Acceptance criteria**:
- [ ] All models have `createdAt` and `updatedAt` fields
- [ ] New records automatically get timestamps
- [ ] Existing data migrates without errors (defaults applied)

---

### Task 1.3: Create Assignment Table

**New file**: `lib/models/assignment.model.ts`

```typescript
import { z } from "zod";

export type AssignmentStatus = "pending" | "active" | "completed";
export type AssignmentSource = "auto" | "manual";

export class Assignment {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  callerId: number;
  status: AssignmentStatus;
  source: AssignmentSource;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    lotId: number,
    bidderId: number,
    callerId: number,
    status: AssignmentStatus = "pending",
    source: AssignmentSource = "auto",
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.lotId = lotId;
    this.bidderId = bidderId;
    this.callerId = callerId;
    this.status = status;
    this.source = source;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AssignmentJSON): Assignment {
    const parsed = AssignmentSchema.parse(json);
    return new Assignment(
      parsed.auctionId,
      parsed.lotId,
      parsed.bidderId,
      parsed.callerId,
      parsed.status,
      parsed.source,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AssignmentJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      lotId: this.lotId,
      bidderId: this.bidderId,
      callerId: this.callerId,
      status: this.status,
      source: this.source,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export const AssignmentSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  lotId: z.number(),
  bidderId: z.number(),
  callerId: z.number(),
  status: z.enum(["pending", "active", "completed"]),
  source: z.enum(["auto", "manual"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AssignmentJSON {
  id?: number;
  auctionId: number;
  lotId: number;
  bidderId: number;
  callerId: number;
  status: AssignmentStatus;
  source: AssignmentSource;
  createdAt?: string;
  updatedAt?: string;
}
```

**New file**: `lib/actions/assignment.actions.ts`

```typescript
import { db } from "@/lib/db/dexie.db";
import { Assignment, AssignmentJSON } from "@/lib/models/assignment.model";

export async function createAssignment(assignment: Assignment): Promise<number> {
  return db.assignments.add(assignment.toJSON());
}

export async function getAssignmentsByAuctionId(auctionId: number): Promise<Assignment[]> {
  const rows = await db.assignments.where("auctionId").equals(auctionId).toArray();
  return rows.map(Assignment.fromJSON);
}

export async function getAssignmentsByLotId(lotId: number): Promise<Assignment[]> {
  const rows = await db.assignments.where("lotId").equals(lotId).toArray();
  return rows.map(Assignment.fromJSON);
}

export async function getAssignmentByLotAndBidder(
  lotId: number,
  bidderId: number
): Promise<Assignment | null> {
  const row = await db.assignments
    .where("[lotId+bidderId]")
    .equals([lotId, bidderId])
    .first();
  return row ? Assignment.fromJSON(row) : null;
}

export async function updateAssignment(assignment: Assignment): Promise<void> {
  if (assignment.id === undefined) throw new Error("Assignment ID required");
  assignment.updatedAt = new Date();
  await db.assignments.put(assignment.toJSON());
}

export async function deleteAssignmentsByAuctionId(auctionId: number): Promise<void> {
  await db.assignments.where("auctionId").equals(auctionId).delete();
}

export async function bulkCreateAssignments(assignments: Assignment[]): Promise<void> {
  await db.assignments.bulkAdd(assignments.map(a => a.toJSON()));
}

export async function bulkReplaceAssignments(
  auctionId: number,
  assignments: Assignment[]
): Promise<void> {
  await db.transaction("rw", db.assignments, async () => {
    await db.assignments.where("auctionId").equals(auctionId).delete();
    await db.assignments.bulkAdd(assignments.map(a => a.toJSON()));
  });
}
```

**Update `dexie.db.ts`**:
```typescript
import { AssignmentJSON } from "@/lib/models/assignment.model";

export class MyDatabase extends Dexie {
  // ... existing tables
  assignments!: Table<AssignmentJSON, number>;

  constructor() {
    super("LotAssignDB");

    this.version(3).stores({
      // ... existing stores
      assignments: "++id, auctionId, lotId, bidderId, callerId, status, source, [lotId+bidderId], [auctionId+callerId], createdAt",
    });
  }
}
```

**Acceptance criteria**:
- [ ] Assignment table created in IndexedDB
- [ ] CRUD operations work correctly
- [ ] Compound indexes enable efficient queries

---

### Task 1.4: Create AuctionConfig Table

**New file**: `lib/models/auction-config.model.ts`

```typescript
import { z } from "zod";

export class AuctionConfig {
  id?: number;
  auctionId: number;
  lotGap: number;
  prioritizePreferences: boolean;
  allowLanguageFallback: boolean;
  balanceWorkload: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    lotGap: number = 5,
    prioritizePreferences: boolean = true,
    allowLanguageFallback: boolean = true,
    balanceWorkload: boolean = true,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.lotGap = lotGap;
    this.prioritizePreferences = prioritizePreferences;
    this.allowLanguageFallback = allowLanguageFallback;
    this.balanceWorkload = balanceWorkload;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AuctionConfigJSON): AuctionConfig {
    const parsed = AuctionConfigSchema.parse(json);
    return new AuctionConfig(
      parsed.auctionId,
      parsed.lotGap,
      parsed.prioritizePreferences,
      parsed.allowLanguageFallback,
      parsed.balanceWorkload,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AuctionConfigJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      lotGap: this.lotGap,
      prioritizePreferences: this.prioritizePreferences,
      allowLanguageFallback: this.allowLanguageFallback,
      balanceWorkload: this.balanceWorkload,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static createDefault(auctionId: number): AuctionConfig {
    return new AuctionConfig(auctionId);
  }
}

export const AuctionConfigSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  lotGap: z.number().min(0).max(50).default(5),
  prioritizePreferences: z.boolean().default(true),
  allowLanguageFallback: z.boolean().default(true),
  balanceWorkload: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AuctionConfigJSON {
  id?: number;
  auctionId: number;
  lotGap: number;
  prioritizePreferences: boolean;
  allowLanguageFallback: boolean;
  balanceWorkload: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

**New file**: `lib/actions/auction-config.actions.ts`

```typescript
import { db } from "@/lib/db/dexie.db";
import { AuctionConfig, AuctionConfigJSON } from "@/lib/models/auction-config.model";

export async function getOrCreateAuctionConfig(auctionId: number): Promise<AuctionConfig> {
  const existing = await db.auctionConfigs
    .where("auctionId")
    .equals(auctionId)
    .first();

  if (existing) {
    return AuctionConfig.fromJSON(existing);
  }

  const config = AuctionConfig.createDefault(auctionId);
  const id = await db.auctionConfigs.add(config.toJSON());
  config.id = id;
  return config;
}

export async function updateAuctionConfig(config: AuctionConfig): Promise<void> {
  if (config.id === undefined) throw new Error("Config ID required");
  config.updatedAt = new Date();
  await db.auctionConfigs.put(config.toJSON());
}

export async function deleteAuctionConfig(auctionId: number): Promise<void> {
  await db.auctionConfigs.where("auctionId").equals(auctionId).delete();
}
```

**Acceptance criteria**:
- [ ] AuctionConfig table created
- [ ] Default config auto-created when accessing auction
- [ ] Config persists across sessions

---

### Task 1.5: Migrate LotBidder Data to Assignments

**New file**: `lib/utils/migration-v3.ts`

```typescript
import { db } from "@/lib/db/dexie.db";
import { Assignment } from "@/lib/models/assignment.model";

/**
 * Migrates existing LotBidder.callerId data to the new Assignment table.
 * This should be run once when upgrading from v2 to v3.
 */
export async function migrateToAssignments(): Promise<{
  migrated: number;
  skipped: number;
}> {
  let migrated = 0;
  let skipped = 0;

  await db.transaction("rw", [db.lotBidders, db.assignments], async () => {
    const lotBidders = await db.lotBidders.toArray();

    for (const lb of lotBidders) {
      // Only migrate if there's an assigned caller
      if (lb.callerId === undefined || lb.callerId === null) {
        skipped++;
        continue;
      }

      // Check if assignment already exists
      const existing = await db.assignments
        .where("[lotId+bidderId]")
        .equals([lb.lotId, lb.bidderId])
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new assignment
      const assignment = new Assignment(
        lb.auctionId,
        lb.lotId,
        lb.bidderId,
        lb.callerId,
        lb.status === "final" ? "completed" : lb.status === "assigned" ? "active" : "pending",
        "auto" // Assume auto since we don't have history
      );

      await db.assignments.add(assignment.toJSON());
      migrated++;
    }
  });

  return { migrated, skipped };
}

/**
 * Checks if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  const lotBiddersWithCaller = await db.lotBidders
    .filter(lb => lb.callerId !== undefined && lb.callerId !== null)
    .count();

  const assignmentCount = await db.assignments.count();

  // Migration needed if there are assigned LotBidders but no Assignments
  return lotBiddersWithCaller > 0 && assignmentCount === 0;
}
```

**Add migration check to app initialization** in `app/layout.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { needsMigration, migrateToAssignments } from "@/lib/utils/migration-v3";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    async function checkMigration() {
      if (await needsMigration()) {
        setMigrating(true);
        const result = await migrateToAssignments();
        console.log(`Migration complete: ${result.migrated} migrated, ${result.skipped} skipped`);
        setMigrating(false);
      }
    }
    checkMigration();
  }, []);

  if (migrating) {
    return (
      <html lang="en">
        <body>
          <div style={{ padding: 40, textAlign: "center" }}>
            <h2>Migrating database...</h2>
            <p>Please wait while we upgrade your data.</p>
          </div>
        </body>
      </html>
    );
  }

  // ... rest of layout
}
```

**Acceptance criteria**:
- [ ] Existing LotBidder assignments migrated to Assignment table
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] User sees migration status during upgrade

---

### Task 1.6: Unify Language (Remove German Strings)

**Files to modify**:
- `components/workflow/auction-callers-list.tsx`
- `app/backups/page.tsx`
- `app/callers/page.tsx`
- `components/DataIntegrityChecker.tsx`

**Search and replace**:

| German | English |
|--------|---------|
| "Bestätigung des Imports" | "Confirm Import" |
| "Einverstanden" | "Confirm" |
| "Abbrechen" | "Cancel" |
| "Priorisierter Bieter" | "Preferred Bidder" |
| "Keine Priorisierung ausgewählt" | "No preference selected" |
| "Doppelte Einträge wurden nicht hochgeladen" | "Duplicate entries were not imported" |
| "Schliessen" | "Close" |
| "Das Importieren einer Backup-Datei..." | "Importing a backup will reset the current database..." |

**Acceptance criteria**:
- [ ] No German text visible in UI
- [ ] All user-facing strings in English

---

### Task 1.7: Comprehensive Algorithm Tests

**New file**: `test/assignment-service.edge-cases.test.ts`

```typescript
import { computeAssignments } from "@/lib/assignment.service";
import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { Language } from "@/lib/models/language.enum";

describe("computeAssignments edge cases", () => {
  const createSnapshot = (overrides: Partial<PlanningSnapshot>): PlanningSnapshot => ({
    lots: [],
    lotBidders: [],
    bidders: [],
    callers: [],
    auctionCallers: [],
    ...overrides,
  });

  describe("empty inputs", () => {
    it("handles no lots", () => {
      const snapshot = createSnapshot({
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: ["D"] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(0);
    });

    it("handles no callers assigned to auction", () => {
      const snapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: ["D"] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: ["D"] }],
        auctionCallers: [], // No callers assigned
      });
      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(1);
    });

    it("handles no bidders", () => {
      const snapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: ["D"] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(0);
    });
  });

  describe("language constraints", () => {
    it("fails when no caller speaks bidder language", () => {
      const snapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: ["Chin."] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: ["D", "E"] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(snapshot, 5);
      // Current implementation falls back to any caller
      // This test documents current behavior
      expect(result.map.size).toBe(1);
    });

    it("assigns bidder without languages to any caller", () => {
      const snapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: ["D"] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(1);
      expect(result.unscheduled.length).toBe(0);
    });
  });

  describe("temporal constraints", () => {
    it("respects lot gap between different bidders", () => {
      const snapshot = createSnapshot({
        lots: [
          { id: 1, auctionId: 1, number: 1, title: "Lot 1" },
          { id: 2, auctionId: 1, number: 2, title: "Lot 2" },
        ],
        bidders: [
          { id: 1, name: "Bidder 1", phone: "123", languages: [] },
          { id: 2, name: "Bidder 2", phone: "456", languages: [] },
        ],
        lotBidders: [
          { id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" },
          { id: 2, auctionId: 1, lotId: 2, bidderId: 2, status: "planned" },
        ],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });

      // With lot gap of 5, single caller can't handle both
      const result = computeAssignments(snapshot, 5);
      expect(result.unscheduled.length).toBe(1);
    });

    it("allows same bidder on consecutive lots", () => {
      const snapshot = createSnapshot({
        lots: [
          { id: 1, auctionId: 1, number: 1, title: "Lot 1" },
          { id: 2, auctionId: 1, number: 2, title: "Lot 2" },
        ],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [] }],
        lotBidders: [
          { id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" },
          { id: 2, auctionId: 1, lotId: 2, bidderId: 1, status: "planned" },
        ],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });

      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(1);
      expect(result.unscheduled.length).toBe(0);
    });
  });

  describe("preferences", () => {
    it("respects preferred caller when feasible", () => {
      const snapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [] }],
        lotBidders: [{
          id: 1, auctionId: 1, lotId: 1, bidderId: 1,
          status: "planned", preferredCallerId: 2
        }],
        callers: [
          { id: 1, name: "Caller 1", abbreviation: "C1", languages: [] },
          { id: 2, name: "Caller 2", abbreviation: "C2", languages: [] },
        ],
        auctionCallers: [
          { id: 1, auctionId: 1, callerId: 1 },
          { id: 2, auctionId: 1, callerId: 2 },
        ],
      });

      const result = computeAssignments(snapshot, 5);
      expect(result.map.get(1)).toBe(2); // Bidder 1 -> Caller 2
    });
  });

  describe("load balancing", () => {
    it("distributes work when possible", () => {
      const snapshot = createSnapshot({
        lots: [
          { id: 1, auctionId: 1, number: 1, title: "Lot 1" },
          { id: 2, auctionId: 1, number: 10, title: "Lot 2" },
          { id: 3, auctionId: 1, number: 20, title: "Lot 3" },
        ],
        bidders: [
          { id: 1, name: "Bidder 1", phone: "123", languages: [] },
          { id: 2, name: "Bidder 2", phone: "456", languages: [] },
          { id: 3, name: "Bidder 3", phone: "789", languages: [] },
        ],
        lotBidders: [
          { id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" },
          { id: 2, auctionId: 1, lotId: 2, bidderId: 2, status: "planned" },
          { id: 3, auctionId: 1, lotId: 3, bidderId: 3, status: "planned" },
        ],
        callers: [
          { id: 1, name: "Caller 1", abbreviation: "C1", languages: [] },
          { id: 2, name: "Caller 2", abbreviation: "C2", languages: [] },
        ],
        auctionCallers: [
          { id: 1, auctionId: 1, callerId: 1 },
          { id: 2, auctionId: 1, callerId: 2 },
        ],
      });

      const result = computeAssignments(snapshot, 5);
      expect(result.map.size).toBe(3);

      // Both callers should be used
      const assignedCallers = new Set(result.map.values());
      expect(assignedCallers.size).toBe(2);
    });
  });

  describe("determinism", () => {
    it("produces same result for same input", () => {
      const snapshot = createSnapshot({
        lots: [
          { id: 1, auctionId: 1, number: 1, title: "Lot 1" },
          { id: 2, auctionId: 1, number: 10, title: "Lot 2" },
        ],
        bidders: [
          { id: 1, name: "Bidder 1", phone: "123", languages: [] },
          { id: 2, name: "Bidder 2", phone: "456", languages: [] },
        ],
        lotBidders: [
          { id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" },
          { id: 2, auctionId: 1, lotId: 2, bidderId: 2, status: "planned" },
        ],
        callers: [
          { id: 1, name: "Caller 1", abbreviation: "C1", languages: [] },
          { id: 2, name: "Caller 2", abbreviation: "C2", languages: [] },
        ],
        auctionCallers: [
          { id: 1, auctionId: 1, callerId: 1 },
          { id: 2, auctionId: 1, callerId: 2 },
        ],
      });

      const result1 = computeAssignments(snapshot, 5);
      const result2 = computeAssignments(snapshot, 5);

      expect([...result1.map.entries()]).toEqual([...result2.map.entries()]);
    });
  });
});
```

**Acceptance criteria**:
- [ ] All edge case tests pass
- [ ] Test coverage for algorithm > 80%
- [ ] `npm run test` passes

---

### Task 1.8: Update Export/Import for New Tables

**Modify**: `lib/utils/db-helpers.ts`

```typescript
export async function exportDatabase(): Promise<DatabaseBackup> {
  const [auctions, lots, bidders, callers, auctionCallers, lotBidders, assignments, auctionConfigs] =
    await Promise.all([
      db.auctions.toArray(),
      db.lots.toArray(),
      db.bidders.toArray(),
      db.callers.toArray(),
      db.auctionCallers.toArray(),
      db.lotBidders.toArray(),
      db.assignments.toArray(),
      db.auctionConfigs.toArray(),
    ]);

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    auctions,
    lots,
    bidders,
    callers,
    auctionCallers,
    lotBidders,
    assignments,
    auctionConfigs,
  };
}

export async function importToDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData) as DatabaseBackup;

  await db.transaction(
    "rw",
    [db.auctions, db.lots, db.bidders, db.callers, db.auctionCallers, db.lotBidders, db.assignments, db.auctionConfigs],
    async () => {
      // Clear all tables
      await Promise.all([
        db.auctions.clear(),
        db.lots.clear(),
        db.bidders.clear(),
        db.callers.clear(),
        db.auctionCallers.clear(),
        db.lotBidders.clear(),
        db.assignments.clear(),
        db.auctionConfigs.clear(),
      ]);

      // Import data
      await db.auctions.bulkPut(backup.auctions);
      await db.lots.bulkPut(backup.lots);
      await db.bidders.bulkPut(backup.bidders);
      await db.callers.bulkPut(backup.callers);
      await db.auctionCallers.bulkPut(backup.auctionCallers);
      await db.lotBidders.bulkPut(backup.lotBidders);

      // Handle optional new tables (backwards compatibility)
      if (backup.assignments) {
        await db.assignments.bulkPut(backup.assignments);
      }
      if (backup.auctionConfigs) {
        await db.auctionConfigs.bulkPut(backup.auctionConfigs);
      }
    }
  );
}

interface DatabaseBackup {
  version: number;
  exportedAt: string;
  auctions: AuctionJSON[];
  lots: LotJSON[];
  bidders: BidderJSON[];
  callers: CallerJSON[];
  auctionCallers: AuctionCallerJSON[];
  lotBidders: LotBidderJSON[];
  assignments?: AssignmentJSON[];
  auctionConfigs?: AuctionConfigJSON[];
}
```

**Acceptance criteria**:
- [ ] Export includes new tables
- [ ] Import handles old backups (without new tables)
- [ ] Round-trip export/import preserves all data

---

## Phase 2: Algorithm

**Duration**: 2-3 weeks
**Goal**: Implement CSP-based assignment algorithm with soft constraint optimization

---

### Task 2.1: Define Constraint Model

**New file**: `lib/algorithm/constraints.ts`

```typescript
import { Language } from "@/lib/models/language.enum";

// ============================================
// TYPES
// ============================================

export interface LotInfo {
  id: number;
  number: number;
}

export interface BidderInfo {
  id: number;
  languages: Language[];
  preferredCallerId?: number;
}

export interface CallerInfo {
  id: number;
  languages: Set<Language>;
}

export interface LotBidderPair {
  lotId: number;
  lotNumber: number;
  bidderId: number;
  bidderLanguages: Language[];
  preferredCallerId?: number;
}

export interface AssignmentVariable {
  lotBidder: LotBidderPair;
  domain: number[]; // Possible caller IDs
  assigned?: number; // Assigned caller ID
}

// ============================================
// HARD CONSTRAINTS
// ============================================

export function languageConstraint(
  bidderLanguages: Language[],
  callerLanguages: Set<Language>
): boolean {
  // Empty bidder languages = any caller is OK
  if (bidderLanguages.length === 0) return true;
  // Empty caller languages = any bidder is OK
  if (callerLanguages.size === 0) return true;
  // At least one language must match
  return bidderLanguages.some(lang => callerLanguages.has(lang));
}

export function temporalConstraint(
  callerAssignments: Map<number, number[]>, // callerId -> assigned lot numbers
  callerId: number,
  lotNumber: number,
  bidderId: number,
  lotGap: number,
  bidderLastLot: Map<number, { lot: number; caller: number }> // bidderId -> last assignment
): boolean {
  const callerLots = callerAssignments.get(callerId) || [];

  for (const assignedLot of callerLots) {
    // Check if this lot is within the gap of another assignment
    const gap = Math.abs(lotNumber - assignedLot);
    if (gap < lotGap && gap > 0) {
      // Only a problem if it's a different bidder
      // Need to check who was assigned at that lot
      return false;
    }
  }

  return true;
}

// ============================================
// SOFT CONSTRAINTS (return scores)
// ============================================

export interface SoftConstraintWeights {
  preferredCaller: number;      // Weight for honoring preferences
  sameCaller: number;           // Weight for same caller across bidder's lots
  loadBalance: number;          // Weight for even distribution
  minimizeTransitions: number;  // Weight for minimizing caller switches
}

export const DEFAULT_WEIGHTS: SoftConstraintWeights = {
  preferredCaller: 100,
  sameCaller: 50,
  loadBalance: 10,
  minimizeTransitions: 20,
};

export function preferredCallerScore(
  preferredCallerId: number | undefined,
  assignedCallerId: number,
  weight: number
): number {
  if (preferredCallerId === undefined) return 0;
  return preferredCallerId === assignedCallerId ? weight : 0;
}

export function sameCallerScore(
  bidderId: number,
  assignedCallerId: number,
  bidderToCallerHistory: Map<number, number>,
  weight: number
): number {
  const previousCaller = bidderToCallerHistory.get(bidderId);
  if (previousCaller === undefined) return 0;
  return previousCaller === assignedCallerId ? weight : 0;
}

export function loadBalanceScore(
  callerAssignmentCounts: Map<number, number>,
  assignedCallerId: number,
  weight: number
): number {
  const counts = Array.from(callerAssignmentCounts.values());
  if (counts.length === 0) return 0;

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const currentCount = callerAssignmentCounts.get(assignedCallerId) || 0;
  const deviation = Math.abs(currentCount - mean);

  // Penalize deviation from mean
  return -weight * deviation;
}
```

**Acceptance criteria**:
- [ ] All constraint functions implemented
- [ ] Unit tests for each constraint
- [ ] Weights are configurable

---

### Task 2.2: Implement CSP Solver

**New file**: `lib/algorithm/csp-solver.ts`

```typescript
import {
  AssignmentVariable,
  LotBidderPair,
  CallerInfo,
  languageConstraint,
  SoftConstraintWeights,
  DEFAULT_WEIGHTS,
  preferredCallerScore,
  sameCallerScore,
  loadBalanceScore,
} from "./constraints";

export interface CSPInput {
  lotBidders: LotBidderPair[];
  callers: CallerInfo[];
  lotGap: number;
  weights?: SoftConstraintWeights;
  allowLanguageFallback?: boolean;
}

export interface CSPSolution {
  assignments: Map<string, number>; // "lotId:bidderId" -> callerId
  unassigned: LotBidderPair[];
  score: number;
  scoreBreakdown: {
    preferences: number;
    continuity: number;
    balance: number;
  };
}

export class CSPSolver {
  private variables: AssignmentVariable[] = [];
  private callers: Map<number, CallerInfo> = new Map();
  private lotGap: number;
  private weights: SoftConstraintWeights;
  private allowLanguageFallback: boolean;

  // State during solving
  private callerAssignmentCounts: Map<number, number> = new Map();
  private callerNextFreeLot: Map<number, number> = new Map();
  private bidderToCallerHistory: Map<number, number> = new Map();

  constructor(input: CSPInput) {
    this.lotGap = input.lotGap;
    this.weights = input.weights || DEFAULT_WEIGHTS;
    this.allowLanguageFallback = input.allowLanguageFallback ?? true;

    // Initialize callers
    for (const caller of input.callers) {
      this.callers.set(caller.id, caller);
      this.callerAssignmentCounts.set(caller.id, 0);
      this.callerNextFreeLot.set(caller.id, 0);
    }

    // Create variables sorted by lot number
    const sorted = [...input.lotBidders].sort((a, b) => a.lotNumber - b.lotNumber);

    for (const lb of sorted) {
      const domain = this.computeDomain(lb);
      this.variables.push({
        lotBidder: lb,
        domain,
      });
    }
  }

  private computeDomain(lb: LotBidderPair): number[] {
    const domain: number[] = [];

    for (const [callerId, caller] of this.callers) {
      // Check language constraint
      const langOk = languageConstraint(lb.bidderLanguages, caller.languages);

      if (langOk) {
        domain.push(callerId);
      } else if (this.allowLanguageFallback) {
        // Add to domain but with lower priority (handled in value ordering)
        domain.push(callerId);
      }
    }

    return domain;
  }

  solve(): CSPSolution {
    const solution: CSPSolution = {
      assignments: new Map(),
      unassigned: [],
      score: 0,
      scoreBreakdown: {
        preferences: 0,
        continuity: 0,
        balance: 0,
      },
    };

    // Reset state
    this.callerAssignmentCounts = new Map();
    this.callerNextFreeLot = new Map();
    this.bidderToCallerHistory = new Map();

    for (const caller of this.callers.keys()) {
      this.callerAssignmentCounts.set(caller, 0);
      this.callerNextFreeLot.set(caller, 0);
    }

    // Process variables in order (sorted by lot number)
    for (const variable of this.variables) {
      const assigned = this.assignVariable(variable, solution);

      if (assigned !== null) {
        const key = `${variable.lotBidder.lotId}:${variable.lotBidder.bidderId}`;
        solution.assignments.set(key, assigned);
        this.updateState(variable, assigned);
      } else {
        solution.unassigned.push(variable.lotBidder);
      }
    }

    return solution;
  }

  private assignVariable(
    variable: AssignmentVariable,
    solution: CSPSolution
  ): number | null {
    const lb = variable.lotBidder;

    // Order domain by score (best first)
    const orderedDomain = this.orderDomain(variable);

    for (const callerId of orderedDomain) {
      if (this.canAssign(lb, callerId)) {
        // Calculate scores
        const prefScore = preferredCallerScore(
          lb.preferredCallerId,
          callerId,
          this.weights.preferredCaller
        );
        const contScore = sameCallerScore(
          lb.bidderId,
          callerId,
          this.bidderToCallerHistory,
          this.weights.sameCaller
        );
        const balScore = loadBalanceScore(
          this.callerAssignmentCounts,
          callerId,
          this.weights.loadBalance
        );

        solution.score += prefScore + contScore + balScore;
        solution.scoreBreakdown.preferences += prefScore;
        solution.scoreBreakdown.continuity += contScore;
        solution.scoreBreakdown.balance += balScore;

        return callerId;
      }
    }

    return null;
  }

  private orderDomain(variable: AssignmentVariable): number[] {
    const lb = variable.lotBidder;

    return [...variable.domain].sort((a, b) => {
      // 1. Preferred caller first
      if (lb.preferredCallerId === a) return -1;
      if (lb.preferredCallerId === b) return 1;

      // 2. Same caller as previous assignment for this bidder
      const prevCaller = this.bidderToCallerHistory.get(lb.bidderId);
      if (prevCaller === a) return -1;
      if (prevCaller === b) return 1;

      // 3. Language match (if fallback is allowed)
      const callerA = this.callers.get(a)!;
      const callerB = this.callers.get(b)!;
      const langMatchA = languageConstraint(lb.bidderLanguages, callerA.languages);
      const langMatchB = languageConstraint(lb.bidderLanguages, callerB.languages);
      if (langMatchA && !langMatchB) return -1;
      if (!langMatchA && langMatchB) return 1;

      // 4. Least busy caller
      const countA = this.callerAssignmentCounts.get(a) || 0;
      const countB = this.callerAssignmentCounts.get(b) || 0;
      return countA - countB;
    });
  }

  private canAssign(lb: LotBidderPair, callerId: number): boolean {
    const nextFree = this.callerNextFreeLot.get(callerId) || 0;

    // Check if caller is available at this lot
    if (lb.lotNumber < nextFree) {
      // Caller is busy until nextFree
      // But if it's the same bidder, that's OK
      const prevBidder = this.bidderToCallerHistory.get(lb.bidderId);
      if (prevBidder !== callerId) {
        return false;
      }
    }

    return true;
  }

  private updateState(variable: AssignmentVariable, callerId: number): void {
    const lb = variable.lotBidder;

    // Update caller assignment count
    const count = this.callerAssignmentCounts.get(callerId) || 0;
    this.callerAssignmentCounts.set(callerId, count + 1);

    // Update caller next free lot
    const currentNext = this.callerNextFreeLot.get(callerId) || 0;
    const newNext = lb.lotNumber + this.lotGap;
    if (newNext > currentNext) {
      this.callerNextFreeLot.set(callerId, newNext);
    }

    // Update bidder history
    this.bidderToCallerHistory.set(lb.bidderId, callerId);
  }
}
```

**Acceptance criteria**:
- [ ] Solver produces valid assignments
- [ ] Solver respects hard constraints
- [ ] Solver optimizes soft constraints
- [ ] Solver handles edge cases gracefully

---

### Task 2.3: Create Assignment Service Facade

**Modify**: `lib/assignment.service.ts`

```typescript
import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { CSPSolver, CSPInput, CSPSolution } from "./algorithm/csp-solver";
import { CallerInfo, LotBidderPair, SoftConstraintWeights } from "./algorithm/constraints";
import { Language } from "./models/language.enum";
import { AuctionConfig } from "./models/auction-config.model";

export interface AssignmentResult {
  // Legacy format (bidder -> caller)
  map: Map<number, number>;
  unscheduled: number[];

  // New detailed format
  detailed: {
    assignments: Map<string, number>; // "lotId:bidderId" -> callerId
    unassigned: Array<{ lotId: number; bidderId: number }>;
    score: number;
    scoreBreakdown: {
      preferences: number;
      continuity: number;
      balance: number;
    };
  };
}

export interface AssignmentOptions {
  lotGap?: number;
  weights?: Partial<SoftConstraintWeights>;
  allowLanguageFallback?: boolean;
  prioritizePreferences?: boolean;
  balanceWorkload?: boolean;
}

export function computeAssignments(
  snapshot: PlanningSnapshot,
  options: AssignmentOptions | number = {} // number for backwards compatibility (lotGap)
): AssignmentResult {
  // Handle legacy call signature
  const opts: AssignmentOptions = typeof options === "number"
    ? { lotGap: options }
    : options;

  const lotGap = opts.lotGap ?? 5;

  // Build lot number lookup
  const lotNumberByLotId = new Map(
    snapshot.lots.map(lot => [lot.id!, lot.number])
  );

  // Build bidder lookup
  const bidderById = new Map(
    snapshot.bidders.map(bidder => [bidder.id!, bidder])
  );

  // Build caller info
  const activeCallerIds = new Set(
    snapshot.auctionCallers.map(ac => ac.callerId)
  );
  const callers: CallerInfo[] = snapshot.callers
    .filter(c => activeCallerIds.has(c.id!))
    .map(c => ({
      id: c.id!,
      languages: new Set(c.languages as Language[]),
    }));

  // Build lot-bidder pairs
  const lotBidders: LotBidderPair[] = snapshot.lotBidders.map(lb => ({
    lotId: lb.lotId,
    lotNumber: lotNumberByLotId.get(lb.lotId) ?? 0,
    bidderId: lb.bidderId,
    bidderLanguages: (bidderById.get(lb.bidderId)?.languages ?? []) as Language[],
    preferredCallerId: lb.preferredCallerId,
  }));

  // Create solver input
  const input: CSPInput = {
    lotBidders,
    callers,
    lotGap,
    allowLanguageFallback: opts.allowLanguageFallback ?? true,
  };

  // Solve
  const solver = new CSPSolver(input);
  const solution = solver.solve();

  // Convert to legacy format
  const legacyMap = new Map<number, number>();
  for (const [key, callerId] of solution.assignments) {
    const [, bidderIdStr] = key.split(":");
    const bidderId = parseInt(bidderIdStr, 10);
    // Only set if not already set (first assignment wins for legacy format)
    if (!legacyMap.has(bidderId)) {
      legacyMap.set(bidderId, callerId);
    }
  }

  const unscheduledBidders = [...new Set(
    solution.unassigned.map(lb => lb.bidderId)
  )];

  return {
    map: legacyMap,
    unscheduled: unscheduledBidders,
    detailed: {
      assignments: solution.assignments,
      unassigned: solution.unassigned.map(lb => ({
        lotId: lb.lotId,
        bidderId: lb.bidderId,
      })),
      score: solution.score,
      scoreBreakdown: solution.scoreBreakdown,
    },
  };
}

// New function using AuctionConfig
export function computeAssignmentsWithConfig(
  snapshot: PlanningSnapshot,
  config: AuctionConfig
): AssignmentResult {
  return computeAssignments(snapshot, {
    lotGap: config.lotGap,
    allowLanguageFallback: config.allowLanguageFallback,
    prioritizePreferences: config.prioritizePreferences,
    balanceWorkload: config.balanceWorkload,
  });
}
```

**Acceptance criteria**:
- [ ] Existing tests still pass (backwards compatibility)
- [ ] New detailed result format available
- [ ] Config-based assignment works

---

### Task 2.4: Add Preview Mode

**New file**: `lib/algorithm/preview.ts`

```typescript
import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { computeAssignments, AssignmentResult, AssignmentOptions } from "@/lib/assignment.service";

export interface AssignmentPreview {
  result: AssignmentResult;
  changes: {
    newAssignments: number;
    changedAssignments: number;
    removedAssignments: number;
  };
  warnings: string[];
  conflicts: Array<{
    lotId: number;
    bidderId: number;
    reason: string;
  }>;
}

export function previewAssignments(
  snapshot: PlanningSnapshot,
  currentAssignments: Map<string, number>, // "lotId:bidderId" -> callerId
  options: AssignmentOptions
): AssignmentPreview {
  const result = computeAssignments(snapshot, options);

  // Calculate changes
  let newAssignments = 0;
  let changedAssignments = 0;
  let removedAssignments = 0;

  const newKeys = new Set(result.detailed.assignments.keys());
  const oldKeys = new Set(currentAssignments.keys());

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      newAssignments++;
    } else if (result.detailed.assignments.get(key) !== currentAssignments.get(key)) {
      changedAssignments++;
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removedAssignments++;
    }
  }

  // Generate warnings
  const warnings: string[] = [];

  if (result.unscheduled.length > 0) {
    warnings.push(`${result.unscheduled.length} bidder(s) could not be assigned`);
  }

  if (result.detailed.scoreBreakdown.preferences < 0) {
    warnings.push("Some preferences could not be honored");
  }

  // Identify conflicts
  const conflicts = result.detailed.unassigned.map(({ lotId, bidderId }) => {
    const bidder = snapshot.bidders.find(b => b.id === bidderId);
    const lot = snapshot.lots.find(l => l.id === lotId);

    return {
      lotId,
      bidderId,
      reason: `No available caller for ${bidder?.name ?? "Unknown"} on Lot ${lot?.number ?? lotId}`,
    };
  });

  return {
    result,
    changes: {
      newAssignments,
      changedAssignments,
      removedAssignments,
    },
    warnings,
    conflicts,
  };
}
```

**Acceptance criteria**:
- [ ] Preview shows expected changes before applying
- [ ] Warnings highlight potential issues
- [ ] Conflicts explained clearly

---

### Task 2.5: Algorithm Benchmarks

**New file**: `test/assignment-benchmark.test.ts`

```typescript
import { computeAssignments } from "@/lib/assignment.service";
import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { Language } from "@/lib/models/language.enum";

function generateSnapshot(
  numLots: number,
  numCallers: number,
  numBidders: number,
  biddersPerLot: number
): PlanningSnapshot {
  const lots = Array.from({ length: numLots }, (_, i) => ({
    id: i + 1,
    auctionId: 1,
    number: i + 1,
    title: `Lot ${i + 1}`,
  }));

  const languages: Language[] = ["D", "E", "F", "I", "S"] as Language[];

  const callers = Array.from({ length: numCallers }, (_, i) => ({
    id: i + 1,
    name: `Caller ${i + 1}`,
    abbreviation: `C${i + 1}`,
    languages: languages.slice(0, Math.floor(Math.random() * 3) + 1),
  }));

  const auctionCallers = callers.map((c, i) => ({
    id: i + 1,
    auctionId: 1,
    callerId: c.id!,
  }));

  const bidders = Array.from({ length: numBidders }, (_, i) => ({
    id: i + 1,
    name: `Bidder ${i + 1}`,
    phone: `123-${i}`,
    languages: [languages[Math.floor(Math.random() * languages.length)]],
  }));

  const lotBidders: any[] = [];
  let lbId = 1;

  for (const lot of lots) {
    // Assign random bidders to each lot
    const shuffled = [...bidders].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, biddersPerLot);

    for (const bidder of selected) {
      lotBidders.push({
        id: lbId++,
        auctionId: 1,
        lotId: lot.id,
        bidderId: bidder.id,
        status: "planned",
      });
    }
  }

  return {
    lots,
    callers,
    auctionCallers,
    bidders,
    lotBidders,
  };
}

describe("Assignment Algorithm Performance", () => {
  const scenarios = [
    { lots: 50, callers: 10, bidders: 30, biddersPerLot: 2 },
    { lots: 100, callers: 20, bidders: 50, biddersPerLot: 3 },
    { lots: 200, callers: 50, bidders: 100, biddersPerLot: 4 },
    { lots: 500, callers: 100, bidders: 200, biddersPerLot: 5 },
  ];

  for (const scenario of scenarios) {
    const name = `${scenario.lots} lots, ${scenario.callers} callers, ${scenario.bidders} bidders`;

    it(`completes ${name} within acceptable time`, () => {
      const snapshot = generateSnapshot(
        scenario.lots,
        scenario.callers,
        scenario.bidders,
        scenario.biddersPerLot
      );

      const start = performance.now();
      const result = computeAssignments(snapshot, 5);
      const elapsed = performance.now() - start;

      console.log(`${name}: ${elapsed.toFixed(2)}ms`);
      console.log(`  Assigned: ${result.map.size}, Unscheduled: ${result.unscheduled.length}`);

      // Assert reasonable performance
      expect(elapsed).toBeLessThan(5000); // 5 seconds max
    });
  }
});
```

**Acceptance criteria**:
- [ ] 200 lots benchmark completes < 5 seconds
- [ ] Performance metrics logged
- [ ] No significant regression from current algorithm

---

## Phase 3: UI Overhaul

**Duration**: 2-3 weeks
**Goal**: Implement new UX with visual assignment editor

---

### Task 3.1: Install New Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand date-fns
npm install -D @types/date-fns
```

**Update `package.json`**:
```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "zustand": "^4.5.0",
    "date-fns": "^3.3.0"
  }
}
```

---

### Task 3.2: Create Global State Store

**New file**: `lib/stores/auction-store.ts`

```typescript
import { create } from "zustand";
import { Auction } from "@/lib/models/auction.model";
import { Lot } from "@/lib/models/lot.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { Assignment } from "@/lib/models/assignment.model";
import { AuctionConfig } from "@/lib/models/auction-config.model";

interface AuctionState {
  // Data
  currentAuction: Auction | null;
  lots: Lot[];
  bidders: Map<number, Bidder>;
  callers: Caller[];
  activeCallerIds: number[];
  assignments: Assignment[];
  config: AuctionConfig | null;

  // UI State
  selectedLotId: number | null;
  selectedBidderId: number | null;
  isAssigning: boolean;
  previewMode: boolean;
  pendingChanges: Assignment[];

  // Actions
  setCurrentAuction: (auction: Auction | null) => void;
  setLots: (lots: Lot[]) => void;
  setBidders: (bidders: Bidder[]) => void;
  setCallers: (callers: Caller[]) => void;
  setActiveCallerIds: (ids: number[]) => void;
  setAssignments: (assignments: Assignment[]) => void;
  setConfig: (config: AuctionConfig) => void;

  selectLot: (lotId: number | null) => void;
  selectBidder: (bidderId: number | null) => void;

  startAssigning: () => void;
  finishAssigning: () => void;

  enterPreviewMode: (changes: Assignment[]) => void;
  exitPreviewMode: () => void;
  applyPreviewChanges: () => void;

  // Computed
  getAssignmentForLotBidder: (lotId: number, bidderId: number) => Assignment | undefined;
  getCallerById: (id: number) => Caller | undefined;
  getBidderById: (id: number) => Bidder | undefined;
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  // Initial state
  currentAuction: null,
  lots: [],
  bidders: new Map(),
  callers: [],
  activeCallerIds: [],
  assignments: [],
  config: null,

  selectedLotId: null,
  selectedBidderId: null,
  isAssigning: false,
  previewMode: false,
  pendingChanges: [],

  // Actions
  setCurrentAuction: (auction) => set({ currentAuction: auction }),
  setLots: (lots) => set({ lots }),
  setBidders: (bidders) => set({ bidders: new Map(bidders.map(b => [b.id!, b])) }),
  setCallers: (callers) => set({ callers }),
  setActiveCallerIds: (ids) => set({ activeCallerIds: ids }),
  setAssignments: (assignments) => set({ assignments }),
  setConfig: (config) => set({ config }),

  selectLot: (lotId) => set({ selectedLotId: lotId }),
  selectBidder: (bidderId) => set({ selectedBidderId: bidderId }),

  startAssigning: () => set({ isAssigning: true }),
  finishAssigning: () => set({ isAssigning: false }),

  enterPreviewMode: (changes) => set({ previewMode: true, pendingChanges: changes }),
  exitPreviewMode: () => set({ previewMode: false, pendingChanges: [] }),
  applyPreviewChanges: () => {
    const { pendingChanges, assignments } = get();
    // Merge pending changes into assignments
    const newAssignments = [...assignments];
    for (const change of pendingChanges) {
      const idx = newAssignments.findIndex(
        a => a.lotId === change.lotId && a.bidderId === change.bidderId
      );
      if (idx >= 0) {
        newAssignments[idx] = change;
      } else {
        newAssignments.push(change);
      }
    }
    set({ assignments: newAssignments, previewMode: false, pendingChanges: [] });
  },

  // Computed
  getAssignmentForLotBidder: (lotId, bidderId) => {
    const { assignments, previewMode, pendingChanges } = get();
    const source = previewMode ? pendingChanges : assignments;
    return source.find(a => a.lotId === lotId && a.bidderId === bidderId);
  },
  getCallerById: (id) => get().callers.find(c => c.id === id),
  getBidderById: (id) => get().bidders.get(id),
}));
```

---

### Task 3.3: Create Assignment Grid Component

**New file**: `components/assignment/AssignmentGrid.tsx`

```typescript
"use client";

import { useMemo } from "react";
import { Box, Paper, Typography, Tooltip, Chip } from "@mui/material";
import { useAuctionStore } from "@/lib/stores/auction-store";

interface GridCell {
  lotId: number;
  lotNumber: number;
  bidderId: number;
  bidderName: string;
  callerId?: number;
  callerAbbr?: string;
  hasLanguageMatch: boolean;
  isPreferred: boolean;
}

export default function AssignmentGrid() {
  const {
    lots,
    callers,
    activeCallerIds,
    assignments,
    bidders,
    previewMode,
    pendingChanges,
    getAssignmentForLotBidder,
    getCallerById,
  } = useAuctionStore();

  const activeCallers = useMemo(
    () => callers.filter(c => activeCallerIds.includes(c.id!)),
    [callers, activeCallerIds]
  );

  // Build grid data
  const gridData = useMemo(() => {
    const data: Map<number, GridCell[]> = new Map(); // callerId -> cells

    for (const caller of activeCallers) {
      data.set(caller.id!, []);
    }

    // Group assignments by caller
    const source = previewMode ? pendingChanges : assignments;

    for (const assignment of source) {
      const lot = lots.find(l => l.id === assignment.lotId);
      const bidder = bidders.get(assignment.bidderId);
      const caller = getCallerById(assignment.callerId);

      if (!lot || !bidder || !caller) continue;

      const cells = data.get(assignment.callerId) || [];
      cells.push({
        lotId: assignment.lotId,
        lotNumber: lot.number,
        bidderId: assignment.bidderId,
        bidderName: bidder.name,
        callerId: assignment.callerId,
        callerAbbr: caller.abbreviation,
        hasLanguageMatch: bidder.languages.length === 0 ||
          bidder.languages.some(l => caller.languages.includes(l)),
        isPreferred: false, // TODO: check preference
      });
      data.set(assignment.callerId, cells);
    }

    // Sort cells by lot number
    for (const cells of data.values()) {
      cells.sort((a, b) => a.lotNumber - b.lotNumber);
    }

    return data;
  }, [lots, bidders, activeCallers, assignments, pendingChanges, previewMode]);

  // Calculate lot range for timeline
  const lotRange = useMemo(() => {
    if (lots.length === 0) return { min: 0, max: 0 };
    const numbers = lots.map(l => l.number);
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  }, [lots]);

  const getCellPosition = (lotNumber: number) => {
    const range = lotRange.max - lotRange.min || 1;
    return ((lotNumber - lotRange.min) / range) * 100;
  };

  return (
    <Paper sx={{ p: 2, overflowX: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Assignment Timeline
      </Typography>

      {/* Lot number header */}
      <Box sx={{ position: "relative", height: 30, mb: 1, ml: 15 }}>
        {lots.filter((_, i) => i % 5 === 0).map(lot => (
          <Typography
            key={lot.id}
            variant="caption"
            sx={{
              position: "absolute",
              left: `${getCellPosition(lot.number)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {lot.number}
          </Typography>
        ))}
      </Box>

      {/* Caller rows */}
      {activeCallers.map(caller => {
        const cells = gridData.get(caller.id!) || [];

        return (
          <Box
            key={caller.id}
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              height: 40,
            }}
          >
            {/* Caller label */}
            <Typography
              variant="body2"
              sx={{
                width: 120,
                flexShrink: 0,
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {caller.abbreviation || caller.name}
            </Typography>

            {/* Timeline */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                height: "100%",
                bgcolor: "grey.100",
                borderRadius: 1,
              }}
            >
              {cells.map(cell => (
                <Tooltip
                  key={`${cell.lotId}-${cell.bidderId}`}
                  title={`Lot ${cell.lotNumber}: ${cell.bidderName}`}
                >
                  <Chip
                    size="small"
                    label={cell.lotNumber}
                    color={cell.hasLanguageMatch ? "primary" : "warning"}
                    sx={{
                      position: "absolute",
                      left: `${getCellPosition(cell.lotNumber)}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}
```

---

### Task 3.4: Create Unassigned Panel Component

**New file**: `components/assignment/UnassignedPanel.tsx`

```typescript
"use client";

import { useMemo } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Chip,
  Badge,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { useAuctionStore } from "@/lib/stores/auction-store";

interface UnassignedItem {
  lotId: number;
  lotNumber: number;
  bidderId: number;
  bidderName: string;
  bidderLanguages: string[];
}

export default function UnassignedPanel() {
  const { lots, bidders, assignments, previewMode, pendingChanges } = useAuctionStore();

  const unassignedItems = useMemo(() => {
    const assignedKeys = new Set(
      (previewMode ? pendingChanges : assignments).map(
        a => `${a.lotId}:${a.bidderId}`
      )
    );

    const items: UnassignedItem[] = [];

    // Find all lot-bidder pairs that should exist but aren't assigned
    // This would come from LotBidder/LotInterest table
    // For now, we'd need to fetch this data separately

    return items;
  }, [lots, bidders, assignments, pendingChanges, previewMode]);

  if (unassignedItems.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Unassigned
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All bidders have been assigned.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="h6">Unassigned</Typography>
        <Badge badgeContent={unassignedItems.length} color="error">
          <WarningIcon color="warning" />
        </Badge>
      </Box>

      <List dense sx={{ maxHeight: 400, overflow: "auto" }}>
        {unassignedItems.map(item => (
          <ListItem
            key={`${item.lotId}-${item.bidderId}`}
            sx={{
              bgcolor: "warning.light",
              mb: 0.5,
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={`Lot ${item.lotNumber}: ${item.bidderName}`}
              secondary={
                item.bidderLanguages.length > 0
                  ? `Languages: ${item.bidderLanguages.join(", ")}`
                  : "No language preference"
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
```

---

### Task 3.5: Create New Auction Page Layout

**Modify**: `app/auction/[id]/page.tsx` (new file)

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuctionStore } from "@/lib/stores/auction-store";
import { getAuctionById } from "@/lib/actions/auction.actions";
import { getLotsByAuctionId } from "@/lib/actions/lot.actions";
import { getAllBidders } from "@/lib/actions/bidder.actions";
import { getAllCallers } from "@/lib/actions/caller.actions";
import { getAuctionCallersByAuctionId } from "@/lib/actions/auction-caller.actions";
import { getAssignmentsByAuctionId } from "@/lib/actions/assignment.actions";
import { getOrCreateAuctionConfig } from "@/lib/actions/auction-config.actions";

import OverviewTab from "./tabs/OverviewTab";
import LotsTab from "./tabs/LotsTab";
import CallersTab from "./tabs/CallersTab";
import AssignmentsTab from "./tabs/AssignmentsTab";

export default function AuctionPage() {
  const params = useParams();
  const auctionId = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const {
    currentAuction,
    setCurrentAuction,
    setLots,
    setBidders,
    setCallers,
    setActiveCallerIds,
    setAssignments,
    setConfig,
  } = useAuctionStore();

  useEffect(() => {
    async function loadAuctionData() {
      try {
        setLoading(true);
        setError(null);

        const [auction, lots, bidders, callers, auctionCallers, assignments, config] =
          await Promise.all([
            getAuctionById(auctionId),
            getLotsByAuctionId(auctionId),
            getAllBidders(),
            getAllCallers(),
            getAuctionCallersByAuctionId(auctionId),
            getAssignmentsByAuctionId(auctionId),
            getOrCreateAuctionConfig(auctionId),
          ]);

        if (!auction) {
          setError("Auction not found");
          return;
        }

        setCurrentAuction(auction);
        setLots(lots);
        setBidders(bidders);
        setCallers(callers);
        setActiveCallerIds(auctionCallers.map(ac => ac.callerId));
        setAssignments(assignments);
        setConfig(config);
      } catch (err) {
        setError("Failed to load auction data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAuctionData();
  }, [auctionId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">{currentAuction?.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {currentAuction?.date.toLocaleDateString()}
          </Typography>
        </Box>
        <Button variant="contained" color="primary">
          Auto-Assign
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Overview" />
        <Tab label="Lots & Bidders" />
        <Tab label="Callers" />
        <Tab label="Assignments" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <LotsTab />}
        {activeTab === 2 && <CallersTab />}
        {activeTab === 3 && <AssignmentsTab />}
      </Box>
    </Box>
  );
}
```

---

### Task 3.6: Update Routing

**Modify**: `app/auction/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { Auction } from "@/lib/models/auction.model";
import { getAllAuctions, createAuction, deleteAuction } from "@/lib/actions/auction.actions";

export default function AuctionsListPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAuction, setNewAuction] = useState({ name: "", date: "" });

  useEffect(() => {
    getAllAuctions().then(setAuctions);
  }, []);

  const handleCreate = async () => {
    if (!newAuction.name || !newAuction.date) return;

    const auction = new Auction(newAuction.name, new Date(newAuction.date));
    const id = await createAuction(auction);

    setAuctions(prev => [...prev, { ...auction, id }]);
    setDialogOpen(false);
    setNewAuction({ name: "", date: "" });

    router.push(`/auction/${id}`);
  };

  const handleDelete = async (id: number) => {
    await deleteAuction(id);
    setAuctions(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Auctions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          New Auction
        </Button>
      </Box>

      <Grid container spacing={3}>
        {auctions.map(auction => (
          <Grid item xs={12} sm={6} md={4} key={auction.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{auction.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {auction.date.toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => router.push(`/auction/${auction.id}`)}
                >
                  Open
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(auction.id!)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Create New Auction</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={newAuction.name}
            onChange={e => setNewAuction(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            type="date"
            fullWidth
            margin="normal"
            value={newAuction.date}
            onChange={e => setNewAuction(prev => ({ ...prev, date: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

---

## Phase 4: Polish & Deploy

**Duration**: 1 week
**Goal**: Production-ready release

---

### Task 4.1: Error Boundaries

**New file**: `components/ErrorBoundary.tsx`

```typescript
"use client";

import { Component, ReactNode } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400 }}>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {this.state.error?.message || "An unexpected error occurred"}
            </Typography>
            <Button
              variant="contained"
              onClick={() => this.setState({ hasError: false, error: null })}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

---

### Task 4.2: Loading States

**New file**: `components/LoadingOverlay.tsx`

```typescript
"use client";

import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export default function LoadingOverlay({ open, message }: LoadingOverlayProps) {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
    >
      <Box textAlign="center">
        <CircularProgress color="inherit" />
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
}
```

---

### Task 4.3: Update GitHub Actions for New Structure

**Modify**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --passWithNoTests

      - name: Run linter
        run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run build

      - name: Add .nojekyll file
        run: touch out/.nojekyll

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### Task 4.4: Final Checklist

**Pre-deployment checklist**:

- [ ] All tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Import/export works correctly
- [ ] Assignment algorithm produces valid results
- [ ] UI is responsive on mobile
- [ ] All text is in English
- [ ] Error states are handled gracefully
- [ ] Loading states are shown appropriately

**Browser testing**:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Performance validation**:

- [ ] Initial load < 3 seconds
- [ ] Assignment calculation < 5 seconds for typical auction
- [ ] No memory leaks during extended use

---

## Appendix: File Checklist

### New Files to Create

| File | Phase | Description |
|------|-------|-------------|
| `lib/models/assignment.model.ts` | 1 | Assignment entity |
| `lib/models/auction-config.model.ts` | 1 | Auction configuration |
| `lib/actions/assignment.actions.ts` | 1 | Assignment CRUD |
| `lib/actions/auction-config.actions.ts` | 1 | Config CRUD |
| `lib/utils/migration-v3.ts` | 1 | Data migration |
| `test/assignment-service.edge-cases.test.ts` | 1 | Algorithm tests |
| `lib/algorithm/constraints.ts` | 2 | Constraint definitions |
| `lib/algorithm/csp-solver.ts` | 2 | CSP solver |
| `lib/algorithm/preview.ts` | 2 | Preview mode |
| `test/assignment-benchmark.test.ts` | 2 | Performance tests |
| `lib/stores/auction-store.ts` | 3 | Global state |
| `components/assignment/AssignmentGrid.tsx` | 3 | Visual grid |
| `components/assignment/UnassignedPanel.tsx` | 3 | Unassigned list |
| `app/auction/[id]/page.tsx` | 3 | Auction detail page |
| `app/auction/[id]/tabs/*.tsx` | 3 | Tab components |
| `components/ErrorBoundary.tsx` | 4 | Error handling |
| `components/LoadingOverlay.tsx` | 4 | Loading states |

### Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `tsconfig.json` | 1 | Strict mode |
| All models in `lib/models/` | 1 | Add timestamps |
| `lib/db/dexie.db.ts` | 1 | New tables, version upgrade |
| `lib/utils/db-helpers.ts` | 1 | Export/import new tables |
| `app/layout.tsx` | 1 | Migration check |
| Various UI files | 1 | Remove German strings |
| `lib/assignment.service.ts` | 2 | Use CSP solver |
| `app/auction/page.tsx` | 3 | New list view |
| `package.json` | 3 | New dependencies |
| `.github/workflows/deploy.yml` | 4 | Add test step |

---

*Document created: 2025-01-22*
*Estimated total effort: 6-9 weeks*
