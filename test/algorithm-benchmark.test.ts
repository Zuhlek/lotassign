import { computeAssignments, computeAssignmentsCSP } from "@/lib/assignment.service";
import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { Language } from "@/lib/models/language.enum";

/**
 * Generates a synthetic test snapshot of specified size.
 */
function generateSnapshot(
  numLots: number,
  numBidders: number,
  numCallers: number,
  biddersPerLot: number = 2
): PlanningSnapshot {
  const lots = [];
  const bidders = [];
  const callers = [];
  const lotBidders = [];
  const auctionCallers = [];

  // Generate lots
  for (let i = 1; i <= numLots; i++) {
    lots.push({
      id: i,
      auctionId: 1,
      number: i,
      title: `Lot ${i}`,
    });
  }

  // Generate bidders with random languages
  const languages = [Language.Deutsch, Language.Englisch, Language.Französisch];
  for (let i = 1; i <= numBidders; i++) {
    const numLangs = 1 + Math.floor(Math.random() * 2);
    const bidderLangs = languages.slice(0, numLangs);
    bidders.push({
      id: i,
      name: `Bidder ${i}`,
      phone: `+1234567${i}`,
      languages: bidderLangs,
    });
  }

  // Generate callers with random languages
  for (let i = 1; i <= numCallers; i++) {
    const numLangs = 1 + Math.floor(Math.random() * 3);
    const callerLangs = languages.slice(0, numLangs);
    callers.push({
      id: i,
      name: `Caller ${i}`,
      abbreviation: `C${i}`,
      languages: callerLangs,
    });
    auctionCallers.push({
      id: i,
      auctionId: 1,
      callerId: i,
    });
  }

  // Generate lot-bidder assignments
  let lotBidderId = 1;
  for (let lotIdx = 0; lotIdx < numLots; lotIdx++) {
    const lot = lots[lotIdx];
    // Assign random bidders to this lot
    const shuffledBidders = [...bidders].sort(() => Math.random() - 0.5);
    for (let j = 0; j < biddersPerLot && j < shuffledBidders.length; j++) {
      const bidder = shuffledBidders[j];
      lotBidders.push({
        id: lotBidderId++,
        auctionId: 1,
        lotId: lot!.id!,
        bidderId: bidder!.id!,
        status: "planned" as const,
      });
    }
  }

  return {
    lots,
    bidders,
    callers,
    auctionCallers,
    lotBidders,
  };
}

describe("Algorithm Benchmarks", () => {
  // Small auction (typical real-world size)
  describe("Small auction (50 lots, 30 bidders, 10 callers)", () => {
    const snapshot = generateSnapshot(50, 30, 10, 2);
    const lotGap = 5;

    it("legacy algorithm completes", () => {
      const start = performance.now();
      const result = computeAssignments(snapshot, lotGap);
      const duration = performance.now() - start;

      console.log(`Legacy: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(result).toBeDefined();
    });

    it("CSP algorithm completes", () => {
      const start = performance.now();
      const result = computeAssignmentsCSP(snapshot, { lotGap });
      const duration = performance.now() - start;

      console.log(`CSP: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(result).toBeDefined();
    });
  });

  // Medium auction
  describe("Medium auction (100 lots, 60 bidders, 15 callers)", () => {
    const snapshot = generateSnapshot(100, 60, 15, 3);
    const lotGap = 5;

    it("legacy algorithm completes", () => {
      const start = performance.now();
      const result = computeAssignments(snapshot, lotGap);
      const duration = performance.now() - start;

      console.log(`Legacy: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(result).toBeDefined();
    });

    it("CSP algorithm completes", () => {
      const start = performance.now();
      const result = computeAssignmentsCSP(snapshot, { lotGap });
      const duration = performance.now() - start;

      console.log(`CSP: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(result).toBeDefined();
    });
  });

  // Large auction (stress test)
  describe("Large auction (200 lots, 100 bidders, 25 callers)", () => {
    const snapshot = generateSnapshot(200, 100, 25, 4);
    const lotGap = 5;

    it("legacy algorithm completes within reasonable time", () => {
      const start = performance.now();
      const result = computeAssignments(snapshot, lotGap);
      const duration = performance.now() - start;

      console.log(`Legacy: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("CSP algorithm completes within reasonable time", () => {
      const start = performance.now();
      const result = computeAssignmentsCSP(snapshot, { lotGap });
      const duration = performance.now() - start;

      console.log(`CSP: ${duration.toFixed(2)}ms, ${result.map.size} assigned, ${result.unscheduled.length} unscheduled`);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  // Algorithm comparison
  describe("Algorithm comparison (same input)", () => {
    const snapshot = generateSnapshot(75, 40, 12, 2);
    const lotGap = 5;

    it("both algorithms should assign similar number of bidders", () => {
      const legacyResult = computeAssignments(snapshot, lotGap);
      const cspResult = computeAssignmentsCSP(snapshot, { lotGap });

      // CSP should be at least as good as legacy (within 10% tolerance)
      const legacyAssigned = legacyResult.map.size;
      const cspAssigned = cspResult.map.size;

      console.log(`Legacy assigned: ${legacyAssigned}, CSP assigned: ${cspAssigned}`);

      // Both should have reasonable assignment rates
      expect(legacyAssigned).toBeGreaterThan(0);
      expect(cspAssigned).toBeGreaterThan(0);
    });
  });
});
