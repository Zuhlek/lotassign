/**
 * CSP Solver Tests
 *
 * Comprehensive test suite covering all edge cases for caller-bidder assignment.
 *
 * EDGE CASE CATEGORIES:
 * 1. Hard Constraints (assignment fails)
 *    - No callers available
 *    - Language mismatch (no caller speaks required language)
 *    - Lot gap violations (all callers busy)
 *    - Final assignment conflicts
 *
 * 2. Soft Constraints (assigned but suboptimal)
 *    - Preferred caller unavailable
 *    - Priority caller unavailable
 *    - Continuity broken (different caller for same bidder)
 *    - Language fallback used
 *    - Load imbalance
 *
 * 3. Complex Scenarios
 *    - Same bidder on consecutive lots
 *    - Multiple bidders on same lot
 *    - High density periods
 *    - Rare language bidders
 *    - Caller priorities with conflicts
 *    - Final assignments blocking options
 */

import { CSPSolver, CSPInput, CSPSolution } from "@/lib/algorithm/csp-solver";
import { Language } from "@/lib/models/language.enum";
import { CallerInfo, LotBidderPair } from "@/lib/algorithm/constraints";

// ============================================
// TEST HELPERS
// ============================================

function createCaller(id: number, languages: Language[]): CallerInfo {
  return { id, languages: new Set(languages) };
}

function createLotBidder(
  lotId: number,
  lotNumber: number,
  bidderId: number,
  languages: Language[] = [],
  preferredCallerId?: number
): LotBidderPair {
  return {
    lotId,
    lotNumber,
    bidderId,
    bidderLanguages: languages,
    preferredCallerId,
  };
}

function getAssignedCaller(solution: CSPSolution, lotId: number, bidderId: number): number | undefined {
  return solution.assignments.get(`${lotId}:${bidderId}`);
}

function isUnassigned(solution: CSPSolution, lotId: number, bidderId: number): boolean {
  return solution.unassigned.some(u => u.lotId === lotId && u.bidderId === bidderId);
}

// ============================================
// 1. HARD CONSTRAINT TESTS
// ============================================

describe("Hard Constraints", () => {
  describe("No Callers Available", () => {
    it("should leave lot-bidder unassigned when no callers exist", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
        callers: [], // No callers
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(1);
      expect(isUnassigned(solution, 1, 100)).toBe(true);
    });
  });

  describe("Language Mismatch", () => {
    it("should assign when language matches", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(0);
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
    });

    it("should use language fallback when no exact match (if allowed)", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Italienisch])],
        callers: [createCaller(1, [Language.Deutsch])], // No Italian speaker
        lotGap: 5,
        allowLanguageFallback: true,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Should still assign with fallback
      expect(solution.unassigned.length).toBe(0);
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
    });

    it("should leave unassigned when no language match and fallback disabled", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Italienisch])],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
        allowLanguageFallback: false,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(1);
    });

    it("should assign bidder with no language preference to any caller", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [])], // No language preference
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(0);
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
    });
  });

  describe("Lot Gap Violations", () => {
    it("should enforce lot gap between different bidders for same caller", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 3, 200, [Language.Deutsch]), // Only 2 lots apart, gap is 5
        ],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // First should be assigned, second should fail (only one caller, busy)
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
      expect(solution.unassigned.length).toBe(1);
      expect(isUnassigned(solution, 2, 200)).toBe(true);
    });

    it("should allow assignment when lot gap is respected", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 10, 200, [Language.Deutsch]), // 9 lots apart, gap is 5
        ],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(0);
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
      expect(getAssignedCaller(solution, 2, 200)).toBe(1);
    });

    it("should allow same bidder on consecutive lots with same caller", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 2, 100, [Language.Deutsch]), // Same bidder, consecutive
          createLotBidder(3, 3, 100, [Language.Deutsch]),
        ],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Same bidder should be allowed with same caller (continuity)
      expect(solution.unassigned.length).toBe(0);
    });
  });

  describe("All Callers Busy", () => {
    it("should leave unassigned when all callers are busy due to lot gap", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 2, 200, [Language.Deutsch]),
          createLotBidder(3, 3, 300, [Language.Deutsch]), // All callers busy
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // First two assigned, third has no available caller
      expect(solution.assignments.size).toBe(2);
      expect(solution.unassigned.length).toBe(1);
    });
  });
});

// ============================================
// 2. SOFT CONSTRAINT TESTS
// ============================================

describe("Soft Constraints", () => {
  describe("Preferred Caller", () => {
    it("should assign preferred caller when available", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch], 2)], // Prefers caller 2
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(getAssignedCaller(solution, 1, 100)).toBe(2);
    });

    it("should use fallback when preferred caller unavailable", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch], 2), // Prefers caller 2
          createLotBidder(2, 2, 200, [Language.Deutsch], 2), // Also prefers caller 2
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // First gets caller 2, second must use caller 1
      expect(getAssignedCaller(solution, 1, 100)).toBe(2);
      expect(getAssignedCaller(solution, 2, 200)).toBe(1);
    });
  });

  describe("Caller Priorities", () => {
    it("should respect caller priorities for bidders", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
        callerPriorities: [
          { callerId: 2, bidderIds: [100] }, // Caller 2 has priority for bidder 100
        ],
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(getAssignedCaller(solution, 1, 100)).toBe(2);
    });

    it("should use priority ranking (rank 1 > rank 2)", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
        callerPriorities: [
          { callerId: 1, bidderIds: [200, 100] }, // Bidder 100 is rank 2 for caller 1
          { callerId: 2, bidderIds: [100] },      // Bidder 100 is rank 1 for caller 2
        ],
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Caller 2 has rank 1 for bidder 100, should win
      expect(getAssignedCaller(solution, 1, 100)).toBe(2);
    });
  });

  describe("Bidder Continuity", () => {
    it("should prefer same caller for same bidder across lots", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 10, 100, [Language.Deutsch]), // Same bidder, later lot
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Both should have same caller for continuity
      const caller1 = getAssignedCaller(solution, 1, 100);
      const caller2 = getAssignedCaller(solution, 2, 100);
      expect(caller1).toBe(caller2);
    });
  });

  describe("Load Balancing", () => {
    it("should distribute work evenly among callers", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 10, 200, [Language.Deutsch]),
          createLotBidder(3, 20, 300, [Language.Deutsch]),
          createLotBidder(4, 30, 400, [Language.Deutsch]),
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Should be roughly 2 assignments per caller
      const counts = new Map<number, number>();
      for (const [, callerId] of solution.assignments) {
        counts.set(callerId, (counts.get(callerId) ?? 0) + 1);
      }

      // Each caller should have 2 assignments
      expect(counts.get(1)).toBe(2);
      expect(counts.get(2)).toBe(2);
    });
  });
});

// ============================================
// 3. COMPLEX SCENARIO TESTS
// ============================================

describe("Complex Scenarios", () => {
  describe("Same Bidder Consecutive Lots", () => {
    it("should handle bidder with multiple consecutive lots", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 5, 100, [Language.Deutsch]),
          createLotBidder(2, 6, 100, [Language.Deutsch]),
          createLotBidder(3, 7, 100, [Language.Deutsch]),
        ],
        callers: [createCaller(1, [Language.Deutsch])],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // All should be assigned to the same caller
      expect(solution.unassigned.length).toBe(0);
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
      expect(getAssignedCaller(solution, 2, 100)).toBe(1);
      expect(getAssignedCaller(solution, 3, 100)).toBe(1);
    });
  });

  describe("Multiple Bidders Same Lot", () => {
    it("should assign different callers to different bidders on same lot", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 10, 100, [Language.Deutsch]),
          createLotBidder(1, 10, 200, [Language.Deutsch]), // Same lot, different bidder
          createLotBidder(1, 10, 300, [Language.Deutsch]),
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
          createCaller(3, [Language.Deutsch]),
        ],
        lotGap: 5,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      expect(solution.unassigned.length).toBe(0);

      // All three should be assigned (can be any caller)
      expect(solution.assignments.size).toBe(3);
    });
  });

  describe("High Density Period", () => {
    it("should handle many lots in close succession", () => {
      const lotBidders: LotBidderPair[] = [];
      for (let i = 1; i <= 10; i++) {
        lotBidders.push(createLotBidder(i, i, 100 + i, [Language.Deutsch]));
      }

      const input: CSPInput = {
        lotBidders,
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
          createCaller(3, [Language.Deutsch]),
        ],
        lotGap: 3, // Smaller gap for this test
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // With 3 callers and gap of 3, should handle up to ~9 lots
      // Some may be unassigned due to density
      expect(solution.assignments.size).toBeGreaterThan(0);
    });
  });

  describe("Rare Language Bidder", () => {
    it("should handle bidder with rare language (only one matching caller)", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Deutsch]),
          createLotBidder(2, 2, 200, [Language.Italienisch]), // Rare: only caller 3 speaks Italian
          createLotBidder(3, 3, 300, [Language.Deutsch]),
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
          createCaller(3, [Language.Italienisch]),
        ],
        lotGap: 5,
        allowLanguageFallback: false,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Italian bidder must get caller 3
      expect(getAssignedCaller(solution, 2, 200)).toBe(3);
    });

    it("should fail if rare language caller is blocked by lot gap", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(1, 1, 100, [Language.Italienisch]),
          createLotBidder(2, 2, 200, [Language.Italienisch]), // Only 1 lot apart
        ],
        callers: [
          createCaller(1, [Language.Italienisch]), // Only Italian speaker
        ],
        lotGap: 5,
        allowLanguageFallback: false,
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // First assigned, second cannot be (same caller needed but busy)
      expect(getAssignedCaller(solution, 1, 100)).toBe(1);
      expect(solution.unassigned.length).toBe(1);
    });
  });

  describe("Final Assignments", () => {
    it("should respect final (locked) assignments", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(2, 2, 200, [Language.Deutsch]),
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
        finalAssignments: [
          { lotId: 1, lotNumber: 1, bidderId: 100, callerId: 1 }, // Locked
        ],
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Final assignment should be in solution
      expect(solution.assignments.get("1:100")).toBe(1);
      expect(solution.constraintNotes.get("1:100")).toContain("Locked");
    });

    it("should work around final assignments when planning other lots", () => {
      const input: CSPInput = {
        lotBidders: [
          createLotBidder(2, 2, 200, [Language.Deutsch]), // Needs assignment
        ],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
        finalAssignments: [
          { lotId: 1, lotNumber: 1, bidderId: 100, callerId: 1 }, // Caller 1 busy until lot 6
        ],
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Lot 2 should use caller 2 (caller 1 is busy due to final assignment)
      expect(getAssignedCaller(solution, 2, 200)).toBe(2);
    });
  });

  describe("Priority Conflicts", () => {
    it("should handle multiple callers with same bidder as priority", () => {
      const input: CSPInput = {
        lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
        callers: [
          createCaller(1, [Language.Deutsch]),
          createCaller(2, [Language.Deutsch]),
        ],
        lotGap: 5,
        callerPriorities: [
          { callerId: 1, bidderIds: [100] },
          { callerId: 2, bidderIds: [100] }, // Both want bidder 100
        ],
      };

      const solver = new CSPSolver(input);
      const solution = solver.solve();

      // Should assign to one of them (first by ID or other tiebreaker)
      expect(solution.assignments.size).toBe(1);
      expect([1, 2]).toContain(getAssignedCaller(solution, 1, 100));
    });
  });
});

// ============================================
// 4. CONSTRAINT NOTE GENERATION TESTS
// ============================================

describe("Constraint Notes", () => {
  it("should generate note for preferred caller match", () => {
    const input: CSPInput = {
      lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch], 1)],
      callers: [createCaller(1, [Language.Deutsch])],
      lotGap: 5,
    };

    const solver = new CSPSolver(input);
    const solution = solver.solve();

    const note = solution.constraintNotes.get("1:100");
    expect(note).toContain("Preferred");
  });

  it("should generate note for priority caller match", () => {
    const input: CSPInput = {
      lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch])],
      callers: [
        createCaller(1, [Language.Deutsch]),
        createCaller(2, [Language.Deutsch]),
      ],
      lotGap: 5,
      callerPriorities: [{ callerId: 2, bidderIds: [100] }],
    };

    const solver = new CSPSolver(input);
    const solution = solver.solve();

    const note = solution.constraintNotes.get("1:100");
    expect(note).toContain("priority");
  });

  it("should generate note for locked final assignment", () => {
    const input: CSPInput = {
      lotBidders: [],
      callers: [createCaller(1, [Language.Deutsch])],
      lotGap: 5,
      finalAssignments: [
        { lotId: 1, lotNumber: 1, bidderId: 100, callerId: 1 },
      ],
    };

    const solver = new CSPSolver(input);
    const solution = solver.solve();

    const note = solution.constraintNotes.get("1:100");
    expect(note).toContain("Locked");
  });

  it("should generate note for continuity", () => {
    const input: CSPInput = {
      lotBidders: [
        createLotBidder(1, 1, 100, [Language.Deutsch]),
        createLotBidder(2, 10, 100, [Language.Deutsch]),
      ],
      callers: [
        createCaller(1, [Language.Deutsch]),
        createCaller(2, [Language.Deutsch]),
      ],
      lotGap: 5,
    };

    const solver = new CSPSolver(input);
    const solution = solver.solve();

    // Second lot should have continuity note
    const note = solution.constraintNotes.get("2:100");
    expect(note).toContain("continuity");
  });
});

// ============================================
// 5. SCORE CALCULATION TESTS
// ============================================

describe("Score Calculation", () => {
  it("should return higher score for optimal assignments", () => {
    const optimalInput: CSPInput = {
      lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch], 1)],
      callers: [createCaller(1, [Language.Deutsch])],
      lotGap: 5,
    };

    const suboptimalInput: CSPInput = {
      lotBidders: [createLotBidder(1, 1, 100, [Language.Deutsch], 2)], // Prefers caller 2
      callers: [createCaller(1, [Language.Deutsch])], // But only caller 1 available
      lotGap: 5,
    };

    const optimalSolver = new CSPSolver(optimalInput);
    const suboptimalSolver = new CSPSolver(suboptimalInput);

    const optimalSolution = optimalSolver.solve();
    const suboptimalSolution = suboptimalSolver.solve();

    expect(optimalSolution.score).toBeGreaterThan(suboptimalSolution.score);
  });

  it("should track score breakdown by category", () => {
    const input: CSPInput = {
      lotBidders: [
        createLotBidder(1, 1, 100, [Language.Deutsch], 1),
        createLotBidder(2, 10, 100, [Language.Deutsch]),
      ],
      callers: [createCaller(1, [Language.Deutsch])],
      lotGap: 5,
    };

    const solver = new CSPSolver(input);
    const solution = solver.solve();

    expect(solution.scoreBreakdown.preferences).toBeGreaterThanOrEqual(0);
    expect(solution.scoreBreakdown.continuity).toBeGreaterThanOrEqual(0);
    expect(typeof solution.scoreBreakdown.balance).toBe("number");
  });
});
