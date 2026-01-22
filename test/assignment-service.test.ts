import fs   from "fs";
import path from "path";

import { computeAssignments } from "@/lib/assignment.service";
import { PlanningSnapshot }   from "@/lib/actions/assignment-logic.actions";
import { Language }           from "@/lib/models/language.enum";

const dumpPath   = path.resolve(__dirname, "./input/happy-case.json");
const dumpRaw    = fs.readFileSync(dumpPath, "utf8");
const dumpJson   = JSON.parse(dumpRaw);

// Helper to create minimal test snapshots
function createSnapshot(overrides: Partial<PlanningSnapshot>): PlanningSnapshot {
  return {
    lots: [],
    lotBidders: [],
    bidders: [],
    callers: [],
    auctionCallers: [],
    ...overrides,
  };
}


const snapshot: PlanningSnapshot = {
  lots:           dumpJson.lots,
  lotBidders:     dumpJson.lotBidders,
  bidders:        dumpJson.bidders,
  callers:        dumpJson.callers,
  auctionCallers: dumpJson.auctionCallers,
};

function intersection<T>(a: Iterable<T>, b: Iterable<T>): boolean {
  const setB = new Set(b);
  for (const v of a) if (setB.has(v)) return true;
  return false;
}

function lotDistanceOk(
  callerAssignments: { lot: number; bidder: number }[],
  minGap: number,
) {
  for (let i = 1; i < callerAssignments.length; i++) {
    const prev = callerAssignments[i - 1];
    const curr = callerAssignments[i];
    if (prev.bidder === curr.bidder) continue;               
    const gap = curr.lot - prev.lot;
    if (gap < minGap) return false;
  }
  return true;
}

describe("computeAssignments on real snapshot", () => {
  const lotGap = 5;
  const { map: assignmentMap, unscheduled } = computeAssignments(snapshot, lotGap);

  it("no unscheduled lot‑bidders", () => {
    expect(unscheduled.length).toBe(0);
  });

  it("each caller respects minimum lot gap unless bidder unchanged", () => {
    const callerToLots: Record<number, { lot: number; bidder: number }[]> = {};

    snapshot.lotBidders.forEach(lb => {
      const callerId = assignmentMap.get(lb.bidderId);
      if (!callerId) return;
      const lotNumber = snapshot.lots.find(l => l.id === lb.lotId)!.number;
      if (!callerToLots[callerId]) callerToLots[callerId] = [];
      callerToLots[callerId].push({ lot: lotNumber, bidder: lb.bidderId });
    });

    for (const lots of Object.values(callerToLots)) {
      lots.sort((a, b) => a.lot - b.lot);
      expect(lotDistanceOk(lots, lotGap)).toBe(true);
    }
  });

  it("assigned caller shares at least one language with bidder (if bidder has languages)", () => {
    const bidderById = new Map(snapshot.bidders.map(b => [b.id!, b]));
    const callerById = new Map(snapshot.callers.map(c => [c.id!, c]));

    for (const [bidderId, callerId] of assignmentMap) {
      const bidderLangs = (bidderById.get(bidderId)!.languages as Language[]) ?? [];
      if (!bidderLangs.length) continue;
      const callerLangs = callerById.get(callerId)!.languages as Language[];
      expect(intersection(bidderLangs, callerLangs)).toBe(true);
    }
  });
});

describe("computeAssignments edge cases", () => {
  describe("empty inputs", () => {
    it("handles no lots", () => {
      const testSnapshot = createSnapshot({
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [Language.Deutsch] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(0);
    });

    it("handles no callers assigned to auction", () => {
      const testSnapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [Language.Deutsch] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [Language.Deutsch] }],
        auctionCallers: [],
      });
      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(1);
    });

    it("handles no bidders", () => {
      const testSnapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [Language.Deutsch] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(0);
      expect(result.unscheduled.length).toBe(0);
    });
  });

  describe("language constraints", () => {
    it("assigns bidder without languages to any caller", () => {
      const testSnapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [{ id: 1, name: "Caller 1", abbreviation: "C1", languages: [Language.Deutsch] }],
        auctionCallers: [{ id: 1, auctionId: 1, callerId: 1 }],
      });
      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(1);
      expect(result.unscheduled.length).toBe(0);
    });

    it("matches bidder language with caller language", () => {
      const testSnapshot = createSnapshot({
        lots: [{ id: 1, auctionId: 1, number: 1, title: "Lot 1" }],
        bidders: [{ id: 1, name: "Bidder 1", phone: "123", languages: [Language.Englisch] }],
        lotBidders: [{ id: 1, auctionId: 1, lotId: 1, bidderId: 1, status: "planned" }],
        callers: [
          { id: 1, name: "Caller 1", abbreviation: "C1", languages: [Language.Deutsch] },
          { id: 2, name: "Caller 2", abbreviation: "C2", languages: [Language.Englisch] },
        ],
        auctionCallers: [
          { id: 1, auctionId: 1, callerId: 1 },
          { id: 2, auctionId: 1, callerId: 2 },
        ],
      });
      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(1);
      expect(result.map.get(1)).toBe(2); // English bidder gets English caller
    });
  });

  describe("temporal constraints", () => {
    it("respects lot gap between different bidders", () => {
      const testSnapshot = createSnapshot({
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

      // With lot gap of 5, single caller can't handle both lots 1 and 2
      const result = computeAssignments(testSnapshot, 5);
      expect(result.unscheduled.length).toBe(1);
    });

    it("allows same bidder on consecutive lots with single caller", () => {
      const testSnapshot = createSnapshot({
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

      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(1);
      expect(result.unscheduled.length).toBe(0);
    });

    it("distributes work across multiple callers when gap would be violated", () => {
      const testSnapshot = createSnapshot({
        lots: [
          { id: 1, auctionId: 1, number: 1, title: "Lot 1" },
          { id: 2, auctionId: 1, number: 3, title: "Lot 2" },
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

      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(2);
      expect(result.unscheduled.length).toBe(0);
    });
  });

  describe("preferences", () => {
    it("respects preferred caller when feasible", () => {
      const testSnapshot = createSnapshot({
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

      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.get(1)).toBe(2); // Bidder 1 -> Caller 2 (preferred)
    });
  });

  describe("load balancing", () => {
    it("distributes work when possible", () => {
      const testSnapshot = createSnapshot({
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

      const result = computeAssignments(testSnapshot, 5);
      expect(result.map.size).toBe(3);

      // Both callers should be used
      const assignedCallers = new Set(result.map.values());
      expect(assignedCallers.size).toBe(2);
    });
  });

  describe("determinism", () => {
    it("produces same result for same input", () => {
      const testSnapshot = createSnapshot({
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

      const result1 = computeAssignments(testSnapshot, 5);
      const result2 = computeAssignments(testSnapshot, 5);

      expect([...result1.map.entries()]).toEqual([...result2.map.entries()]);
    });
  });
});
