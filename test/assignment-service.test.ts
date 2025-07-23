import fs   from "fs";
import path from "path";

import { computeAssignments } from "@/lib/assignment.service";
import { PlanningSnapshot }   from "@/lib/actions/assignment-logic.actions";
import { Language }           from "@/lib/models/language.enum";

const dumpPath   = path.resolve(__dirname, "./input/happy-case.json");
const dumpRaw    = fs.readFileSync(dumpPath, "utf8");
const dumpJson   = JSON.parse(dumpRaw);


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
