# LotAssign - Refactoring Plan & Research Paper

## Executive Summary

This document provides a comprehensive analysis of the LotAssign application, researches optimal algorithms for the employee-to-bidder assignment problem, and proposes a detailed refactoring plan for the data model, algorithm, tests, and UI/UX.

---

## Part 1: Problem Domain Analysis

### 1.1 Core Business Problem

**Goal**: Assign employees (callers) to bidders interested in auction lots, ensuring:
- Each bidder has exactly one caller assigned to handle their bids
- Callers speak the bidder's language
- Callers have enough time to transition between bidders (travel/setup time)
- Preferred caller-bidder relationships are respected when possible
- Workload is balanced across available callers

### 1.2 Constraints

| Constraint Type | Description | Current Handling |
|-----------------|-------------|------------------|
| **Hard: Language** | Caller must speak at least one of bidder's languages | Yes (with fallback) |
| **Hard: Availability** | Caller can only handle one bidder at a time | Yes (via lot gap) |
| **Hard: Temporal** | Lots are auctioned sequentially by lot number | Yes |
| **Soft: Preference** | Bidder may prefer a specific caller | Yes (priority) |
| **Soft: Load Balance** | Distribute work evenly across callers | Partial |
| **Soft: Continuity** | Same caller for same bidder across lots | Implicit (bidder-level assignment) |

### 1.3 Problem Classification

This is a variant of several well-known optimization problems:

1. **Assignment Problem** - Bipartite matching of callers to bidders
2. **Job Shop Scheduling** - Temporal sequencing with resource constraints
3. **Constraint Satisfaction Problem (CSP)** - Multiple hard/soft constraints
4. **Vehicle Routing Problem (VRP)** - Resource allocation with travel time

---

## Part 2: Current Implementation Analysis

### 2.1 Current Algorithm: Greedy with Priority

**Location**: `lib/assignment.service.ts`

```
Algorithm: computeAssignments(snapshot, lotGap)

1. Build bidder info map (aggregate lots per bidder)
2. Build caller state map (track availability)
3. PHASE 1: Assign preferred callers first
   - Sort bidders by first lot number
   - For each bidder with preferred caller:
     - Check timing feasibility
     - Assign if possible, else mark unscheduled
4. PHASE 2: Assign remaining bidders
   - Sort by first lot number
   - For each bidder:
     - Find best caller (language match + lowest workload)
     - Fallback: ignore language if no match
     - Assign or mark unscheduled
```

### 2.2 Algorithm Weaknesses

| Issue | Description | Impact |
|-------|-------------|--------|
| **Greedy** | Makes locally optimal choices | May miss globally optimal solutions |
| **Bidder-level assignment** | Same caller for all bidder's lots | Inflexible; misses optimization opportunities |
| **Simple lot gap** | Fixed gap after last lot | Doesn't model actual travel time |
| **No backtracking** | Once assigned, never reconsidered | Suboptimal when early choices block later ones |
| **Load balance heuristic** | Only considers lot count | Ignores temporal distribution |
| **Sequential processing** | Order-dependent results | Different input order = different output |

### 2.3 Current Data Model Analysis

**Strengths**:
- Clean separation of entities
- Zod validation for type safety
- Junction tables for M:N relationships
- Status tracking for workflow

**Weaknesses**:

| Entity | Issue | Recommendation |
|--------|-------|----------------|
| `LotBidder` | Overloaded - stores both relationship AND assignment | Split into separate concerns |
| `Bidder` | Languages stored as array | Works but normalization could help |
| `Caller` | No availability windows | Add scheduling constraints |
| `AuctionCaller` | No per-auction preferences | Extend with priority/availability |
| General | No audit trail | Add created/updated timestamps |
| General | IDs are auto-increment | Consider UUIDs for sync scenarios |

### 2.4 Current Test Coverage

**File**: `test/assignment-service.test.ts`

**Coverage**:
- Happy path with real data snapshot
- Verifies no unscheduled bidders
- Verifies lot gap respected
- Verifies language compatibility

**Missing**:
- Edge cases (no callers, no bidders, conflicts)
- Stress tests (many bidders, few callers)
- Preference handling verification
- Load balancing verification
- Algorithm determinism tests

### 2.5 Current UI/UX Analysis

**Pages**:
1. **Home** (`/`) - Navigation buttons + DB status
2. **Callers** (`/callers`) - CRUD for callers, Excel import
3. **Auctions** (`/auction`) - 3-column layout: auctions | lots/bidders | callers
4. **Backups** (`/backups`) - Import/export JSON

**UX Issues**:

| Issue | Location | Severity |
|-------|----------|----------|
| Mixed German/English | Throughout | Medium |
| No assignment visualization | Auction page | High |
| Manual "Assign Callers" click | Auction page | Medium |
| No undo/redo | All | Medium |
| No assignment preview | Auction page | High |
| Caller preferences UI confusing | Auction callers dialog | High |
| No conflict/warning display | Auction page | High |
| No bulk operations | Lots/bidders | Medium |

---

## Part 3: Algorithm Research

### 3.1 Candidate Algorithms

#### 3.1.1 Hungarian Algorithm (Kuhn-Munkres)

**Overview**: Optimal solution for bipartite matching problems.

**Complexity**: O(n³)

**Pros**:
- Guaranteed optimal assignment
- Well-understood, proven correct
- Good for one-time assignments

**Cons**:
- Designed for simple bipartite matching
- Doesn't handle temporal constraints natively
- Requires cost matrix construction

**Applicability**: Partial - good for single-lot assignments, needs extension for temporal constraints.

**Sources**: [Wikipedia](https://en.wikipedia.org/wiki/Hungarian_algorithm), [GeeksforGeeks](https://www.geeksforgeeks.org/dsa/hungarian-algorithm-assignment-problem-set-1-introduction/)

#### 3.1.2 Constraint Satisfaction Problem (CSP) Solver

**Overview**: Model problem as variables, domains, and constraints; use backtracking with heuristics.

**Complexity**: Varies (exponential worst case, often much better with good heuristics)

**Pros**:
- Natural fit for scheduling problems
- Handles hard and soft constraints
- Flexible and extensible

**Cons**:
- Requires careful constraint modeling
- Performance depends on problem structure
- May need custom heuristics

**Applicability**: Excellent - this is essentially a CSP.

**Sources**: [CSP GitHub Topics](https://github.com/topics/constraint-satisfaction-problem?l=javascript), [OR-Tools](https://developers.google.com/optimization/cp)

#### 3.1.3 Genetic Algorithm

**Overview**: Evolutionary approach with populations, selection, crossover, mutation.

**Complexity**: Configurable (generations × population size)

**Pros**:
- Good for complex, multi-objective problems
- Can escape local optima
- Parallelizable

**Cons**:
- No optimality guarantee
- Requires tuning (population size, mutation rate)
- Slower convergence

**Applicability**: Good for large instances where optimal solution isn't required.

#### 3.1.4 Greedy with Backtracking

**Overview**: Enhanced greedy that can undo choices when stuck.

**Complexity**: O(n²) to O(n³) depending on backtracking depth

**Pros**:
- Simple to implement and understand
- Better than pure greedy
- Fast for most cases

**Cons**:
- Still not guaranteed optimal
- Backtracking depth is a tuning parameter

**Applicability**: Good middle-ground for this problem size.

#### 3.1.5 Integer Linear Programming (ILP)

**Overview**: Formulate as mathematical optimization with linear constraints.

**Complexity**: NP-hard in general, but solvers are highly optimized

**Pros**:
- Optimal solutions
- Very expressive constraint language
- Mature solvers available

**Cons**:
- Requires mathematical formulation
- External solver dependency
- Can be slow for large instances

**Applicability**: Overkill for typical auction sizes, but excellent for complex constraints.

### 3.2 Recommended Approach

**Primary**: CSP-based algorithm with weighted soft constraints
**Fallback**: Enhanced greedy with backtracking

**Rationale**:
1. Problem is naturally a CSP (variables = assignments, constraints = language/time/preference)
2. Typical auction size (50-200 lots, 20-50 callers, 50-100 bidders) is manageable
3. User needs to understand results (CSP easier to explain than ILP)
4. Browser-based execution rules out heavy solvers

### 3.3 Proposed Algorithm

```
Algorithm: CSPAssignment(lots, bidders, callers, constraints)

Variables:
  For each (lot, bidder) pair: Assignment[lot][bidder] ∈ {caller_1, ..., caller_n, null}

Hard Constraints:
  1. OneCallerPerLotBidder: Each (lot, bidder) has exactly one caller
  2. LanguageMatch: caller.languages ∩ bidder.languages ≠ ∅
  3. NoOverlap: For each caller, assigned (lot, bidder) pairs don't conflict temporally
  4. CallerAvailable: Caller must be assigned to auction

Soft Constraints (with weights):
  1. PreferredCaller: +100 if bidder.preferredCaller == assigned caller
  2. SameCaller: +50 if same bidder gets same caller across lots
  3. LoadBalance: -10 * deviation from mean assignments
  4. MinTransition: +20 if transition time exceeds minimum

Solver:
  1. Arc consistency preprocessing
  2. Backtracking search with:
     - MRV (Minimum Remaining Values) variable ordering
     - LCV (Least Constraining Value) value ordering
  3. Soft constraint optimization via local search after feasible solution found

Output:
  - Assignment map: (lot, bidder) → caller
  - Unassigned list: (lot, bidder) pairs that couldn't be assigned
  - Score breakdown: how well soft constraints were satisfied
```

---

## Part 4: Proposed Data Model

### 4.1 Schema Changes

```typescript
// Enhanced Caller
interface Caller {
  id: string;                    // UUID instead of auto-increment
  name: string;
  abbreviation: string;
  languages: Language[];
  defaultPriority: number;       // NEW: default assignment priority (1-10)
  createdAt: Date;               // NEW: audit
  updatedAt: Date;               // NEW: audit
}

// Enhanced AuctionCaller (caller participation in an auction)
interface AuctionCaller {
  id: string;
  auctionId: string;
  callerId: string;
  isAvailable: boolean;          // NEW: can toggle availability
  priority: number;              // NEW: auction-specific priority override
  maxAssignments?: number;       // NEW: optional cap
}

// Split LotBidder into two concerns
interface LotInterest {
  id: string;
  auctionId: string;
  lotId: string;
  bidderId: string;
  status: 'registered' | 'confirmed' | 'withdrawn';  // Simplified status
  preferredCallerId?: string;    // Moved preference here
  createdAt: Date;
}

interface Assignment {
  id: string;
  auctionId: string;
  lotId: string;
  bidderId: string;
  callerId: string;
  assignedAt: Date;              // When assignment was made
  assignedBy: 'auto' | 'manual'; // How it was assigned
  status: 'pending' | 'active' | 'completed';
}

// NEW: Assignment configuration per auction
interface AuctionConfig {
  id: string;
  auctionId: string;
  lotGap: number;                // Minimum lots between different bidders
  prioritizePreferences: boolean;
  allowLanguageFallback: boolean;
  balanceWorkload: boolean;
}
```

### 4.2 Migration Path

1. Add new fields with defaults (non-breaking)
2. Create new `Assignment` table
3. Migrate data from `LotBidder.callerId` to `Assignment`
4. Remove redundant fields from `LotBidder`
5. Rename `LotBidder` to `LotInterest`

---

## Part 5: Proposed UI/UX Redesign

### 5.1 Information Architecture

```
NEW STRUCTURE:

/                       → Dashboard (auction overview + quick actions)
/auction/:id            → Single Auction View (unified workspace)
/auction/:id/assign     → Assignment Editor (visual tool)
/callers                → Caller Management (simplified)
/settings               → App Settings + Data Management
```

### 5.2 Key UI Improvements

#### 5.2.1 Dashboard (`/`)
- List of auctions with status indicators
- Quick stats: lots, bidders, assigned %, unassigned
- One-click "Create Auction"
- One-click "Import Data"

#### 5.2.2 Auction View (`/auction/:id`)
- **Header**: Auction name, date, status badge
- **Tab 1: Overview** - Summary stats, unassigned warnings
- **Tab 2: Lots & Bidders** - Scrollable table with inline status
- **Tab 3: Callers** - Available callers for this auction
- **Tab 4: Assignments** - Visual assignment grid/timeline
- **Floating Action Button**: "Auto-Assign" with preview

#### 5.2.3 Assignment Editor (`/auction/:id/assign`)
- **Left Panel**: Unassigned lot-bidder pairs
- **Center**: Visual timeline/grid showing lots (x-axis) and callers (y-axis)
- **Right Panel**: Selected assignment details
- **Features**:
  - Drag-and-drop manual assignment
  - Color-coded language compatibility
  - Conflict highlighting (red borders)
  - Hover tooltips with bidder/caller details
  - One-click auto-assign with live preview
  - Undo/redo support

#### 5.2.4 Caller Management (`/callers`)
- Simplified table with inline editing
- Bulk language assignment
- Import from Excel (existing)
- Search/filter by language

### 5.3 UX Principles

1. **Progressive Disclosure**: Show summary first, details on demand
2. **Immediate Feedback**: Validate conflicts in real-time
3. **Undo Safety**: All actions reversible
4. **Visual Priority**: Most important info (unassigned, conflicts) most prominent
5. **Consistency**: Same patterns throughout (tables, dialogs, buttons)
6. **Language**: English only (remove German strings)

---

## Part 6: Test Strategy

### 6.1 Unit Tests

```typescript
// Algorithm Tests
describe('CSPAssignment', () => {
  // Basic functionality
  it('assigns all bidders when solution exists');
  it('respects language constraints');
  it('respects temporal constraints (lot gap)');
  it('prioritizes preferred callers');

  // Edge cases
  it('handles no callers assigned to auction');
  it('handles no bidders for any lot');
  it('handles single lot with many bidders');
  it('handles single bidder across many lots');
  it('handles impossible constraints gracefully');

  // Performance
  it('completes within 5s for 200 lots, 50 callers, 100 bidders');

  // Determinism
  it('produces consistent results for same input');

  // Soft constraints
  it('balances workload when possible');
  it('maximizes same-caller continuity for bidders');
});

// Data Model Tests
describe('Assignment', () => {
  it('validates required fields');
  it('prevents duplicate assignments');
  it('cascades deletion correctly');
});
```

### 6.2 Integration Tests

```typescript
describe('Assignment Workflow', () => {
  it('imports Excel → creates lots/bidders → assigns → exports');
  it('manual assignment overrides auto-assignment');
  it('re-running auto-assign updates existing assignments');
});
```

### 6.3 E2E Tests (Future)

- Full user workflow with Playwright/Cypress
- Performance benchmarks with realistic data sizes

---

## Part 7: Implementation Phases

### Phase 1: Foundation (Est. 1-2 weeks)

**Goal**: Stabilize data model and prepare for algorithm work

1. [ ] Add TypeScript strict mode
2. [ ] Add timestamps to all models
3. [ ] Create `Assignment` table (new)
4. [ ] Create `AuctionConfig` table (new)
5. [ ] Write data migration script
6. [ ] Unify language (remove German strings)
7. [ ] Add comprehensive unit tests for existing algorithm

### Phase 2: Algorithm (Est. 2-3 weeks)

**Goal**: Implement CSP-based assignment algorithm

1. [ ] Design constraint model
2. [ ] Implement CSP solver (or integrate library)
3. [ ] Add soft constraint weighting
4. [ ] Add backtracking for infeasible cases
5. [ ] Benchmark against current greedy algorithm
6. [ ] Write extensive algorithm tests
7. [ ] Add assignment preview/dry-run mode

### Phase 3: UI Overhaul (Est. 2-3 weeks)

**Goal**: Implement new UX with visual assignment editor

1. [ ] Implement new routing structure
2. [ ] Create Dashboard component
3. [ ] Create unified Auction View with tabs
4. [ ] Create visual Assignment Editor
   - Timeline/grid visualization
   - Drag-and-drop support
   - Conflict highlighting
5. [ ] Add undo/redo support
6. [ ] Polish and responsive design

### Phase 4: Polish & Deploy (Est. 1 week)

**Goal**: Production-ready release

1. [ ] Performance optimization
2. [ ] Error handling and user feedback
3. [ ] Documentation updates
4. [ ] GitHub Pages deployment verification
5. [ ] User acceptance testing

---

## Part 8: Technical Decisions

### 8.1 Keep
- **Next.js 15** - Works well for static export
- **Material-UI** - Comprehensive component library
- **Dexie/IndexedDB** - Client-side storage is the requirement
- **Zod** - Type-safe validation

### 8.2 Add
- **React DnD** or **@dnd-kit/core** - For drag-and-drop assignment
- **date-fns** - Consistent date handling
- **zustand** or **jotai** - Lightweight state management for complex UI state

### 8.3 Consider
- **Web Workers** - For running algorithm off main thread
- **vitest** - Faster test runner than Jest

### 8.4 Remove
- ExcelJS file-saver patterns work, keep but simplify

---

## Part 9: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Algorithm too slow | Low | High | Use Web Workers, add timeout |
| CSP solver complexity | Medium | Medium | Fall back to enhanced greedy |
| Data migration issues | Low | High | Thorough testing, backup prompts |
| UI complexity | Medium | Medium | Iterative development, user feedback |
| Browser compatibility | Low | Low | Test on major browsers |

---

## Appendix A: References

### Algorithm Research
- [Hungarian Algorithm - Wikipedia](https://en.wikipedia.org/wiki/Hungarian_algorithm)
- [Assignment Problem - Wikipedia](https://en.wikipedia.org/wiki/Assignment_problem)
- [GeeksforGeeks - Hungarian Algorithm](https://www.geeksforgeeks.org/dsa/hungarian-algorithm-assignment-problem-set-1-introduction/)
- [OR-Tools Constraint Programming](https://developers.google.com/optimization/cp)
- [CSP GitHub Topics](https://github.com/topics/constraint-satisfaction-problem?l=javascript)

### Related Problems
- [Nurse Scheduling Problem](https://arxiv.org/pdf/1902.01193)
- [Job Shop Scheduling](https://en.wikipedia.org/wiki/Job_shop_scheduling)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Lot** | An item being auctioned |
| **Bidder** | A person/entity interested in one or more lots |
| **Caller** | An employee who handles phone bids for bidders |
| **Assignment** | The mapping of a caller to a bidder for a specific lot |
| **Lot Gap** | Minimum number of lots between a caller's assignments to different bidders |
| **CSP** | Constraint Satisfaction Problem |
| **Hard Constraint** | Must be satisfied for valid solution |
| **Soft Constraint** | Should be satisfied but can be violated with penalty |

---

*Document created: 2025-01-22*
*Last updated: 2025-01-22*
