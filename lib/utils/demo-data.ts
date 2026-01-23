import { db } from "@/lib/db/dexie.db";
import { Language } from "@/lib/models/language.enum";

/**
 * Comprehensive demo data that showcases all features and edge cases:
 *
 * CALLERS (10):
 * - Mix of language skills (German, English, French, Italian, Spanish)
 * - Some multilingual, some single-language
 *
 * BIDDERS (15):
 * - Various language requirements
 * - One with rare language (edge case)
 * - One with no language preference (any caller OK)
 *
 * LOTS (25):
 * - Spread across lot numbers 1-50 (with gaps)
 * - Multiple bidders per lot in some cases
 * - Consecutive lots for same bidder (tests caller continuity)
 *
 * EDGE CASES DEMONSTRATED:
 * 1. Same bidder on consecutive lots (lots 5,6,7) - same caller should handle
 * 2. Multiple bidders on same lot (lot 10) - different callers needed
 * 3. Bidder with rare language (Italian only) - may need fallback
 * 4. High-density period (lots 15-20) - tests load balancing
 * 5. Preferred caller assignment (bidder 3 prefers caller 2)
 */

export async function loadDemoData(): Promise<void> {
  // Clear existing data
  await db.transaction(
    "rw",
    [db.auctions, db.lots, db.bidders, db.callers, db.auctionCallers, db.lotBidders, db.assignments, db.auctionConfigs],
    async () => {
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

      // ========== CALLERS ==========
      const callers = [
        { id: 1, name: "Laura Berger", abbreviation: "LB", languages: [Language.Deutsch, Language.Englisch] },
        { id: 2, name: "Thomas Reed", abbreviation: "TR", languages: [Language.Englisch] },
        { id: 3, name: "Claire Moreau", abbreviation: "CM", languages: [Language.Französisch, Language.Englisch] },
        { id: 4, name: "Luca Fontana", abbreviation: "LF", languages: [Language.Italienisch, Language.Deutsch] },
        { id: 5, name: "Felix Braun", abbreviation: "FB", languages: [Language.Deutsch] },
        { id: 6, name: "Nina Favre", abbreviation: "NF", languages: [Language.Französisch, Language.Deutsch, Language.Englisch] },
        { id: 7, name: "Diego Torres", abbreviation: "DT", languages: [Language.Spanisch, Language.Englisch] },
        { id: 8, name: "Sabine Keller", abbreviation: "SK", languages: [Language.Deutsch, Language.Italienisch] },
        { id: 9, name: "Oliver Grant", abbreviation: "OG", languages: [Language.Englisch] },
        { id: 10, name: "Emma Fischer", abbreviation: "EF", languages: [Language.Englisch, Language.Deutsch] },
      ];

      await db.callers.bulkAdd(callers.map(c => ({
        ...c,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })));

      // ========== BIDDERS ==========
      const bidders = [
        { id: 1, name: "Galerie Alpstein", phone: "+41 44 234 5678", languages: [Language.Deutsch] },
        { id: 2, name: "Brighton Collectors", phone: "+44 20 7946 0958", languages: [Language.Englisch] },
        { id: 3, name: "Maison Beaumont", phone: "+33 1 42 68 53 00", languages: [Language.Französisch] },
        { id: 4, name: "Studio Venezia", phone: "+39 041 522 4567", languages: [Language.Italienisch] }, // Edge: rare language
        { id: 5, name: "Helvetia Trust", phone: "+41 44 567 8901", languages: [Language.Deutsch, Language.Englisch] },
        { id: 6, name: "Kensington Arts", phone: "+44 20 7123 4567", languages: [Language.Englisch] },
        { id: 7, name: "Atelier Rivière", phone: "+33 1 45 67 89 01", languages: [Language.Französisch, Language.Englisch] },
        { id: 8, name: "Pacific Holdings", phone: "+1 415 555 0123", languages: [] }, // Edge: any language OK
        { id: 9, name: "Rothenburg Antiquitäten", phone: "+49 89 123 4567", languages: [Language.Deutsch] },
        { id: 10, name: "Fundación Castilla", phone: "+34 91 234 5678", languages: [Language.Spanisch] },
        { id: 11, name: "Donau Privatstiftung", phone: "+43 1 234 5678", languages: [Language.Deutsch] },
        { id: 12, name: "Manhattan Fine Art", phone: "+1 212 555 0456", languages: [Language.Englisch] },
        { id: 13, name: "Léman Investments", phone: "+41 22 345 6789", languages: [Language.Deutsch, Language.Französisch] },
        { id: 14, name: "Provence Collection", phone: "+33 4 91 23 45 67", languages: [Language.Französisch] },
        { id: 15, name: "Nordlicht Stiftung", phone: "+49 40 234 5678", languages: [Language.Deutsch, Language.Englisch] },
      ];

      await db.bidders.bulkAdd(bidders.map(b => ({
        ...b,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })));

      // ========== AUCTION ==========
      const auctionId = await db.auctions.add({
        name: "Evening Sale - Modern & Contemporary",
        date: new Date("2025-06-15").toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ========== AUCTION CALLERS (all 10 callers assigned) ==========
      await db.auctionCallers.bulkAdd(
        callers.map((c, idx) => ({
          id: idx + 1,
          auctionId,
          callerId: c.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );

      // ========== LOTS ==========
      const lots = [
        { number: 1, title: "Oil on Canvas, Landscape" },
        { number: 3, title: "Bronze Sculpture, Abstract" },
        { number: 5, title: "Mixed Media on Paper" },
        { number: 6, title: "Acrylic on Canvas" },
        { number: 7, title: "Watercolor Study" },
        { number: 10, title: "Portrait, 19th Century" },
        { number: 12, title: "Still Life with Flowers" },
        { number: 15, title: "Large Format Photography" },
        { number: 16, title: "Silkscreen Print, Edition" },
        { number: 17, title: "Lithograph, Signed" },
        { number: 18, title: "Steel Installation" },
        { number: 19, title: "Marble Relief" },
        { number: 20, title: "Contemporary Collage" },
        { number: 25, title: "Vintage Silver Print" },
        { number: 28, title: "Video Installation" },
        { number: 30, title: "Light Sculpture" },
        { number: 35, title: "Spray Paint on Canvas" },
        { number: 38, title: "Digital Print, 1/1" },
        { number: 40, title: "Terracotta Figure" },
        { number: 42, title: "Decorative Panel" },
        { number: 45, title: "Surrealist Drawing" },
        { number: 47, title: "Geometric Composition" },
        { number: 48, title: "Color Study" },
        { number: 49, title: "Architectural Model" },
        { number: 50, title: "Rare Manuscript Page" },
      ];

      const lotIds: number[] = [];
      for (const lot of lots) {
        const id = await db.lots.add({
          auctionId,
          number: lot.number,
          title: lot.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        lotIds.push(id);
      }

      // ========== LOT-BIDDER ASSIGNMENTS ==========
      // Format: [lotIndex, bidderId, preferredCallerId?]
      const lotBidderAssignments: [number, number, number?][] = [
        // Lot 1: German bidder
        [0, 1],
        // Lot 3: English bidder
        [1, 2],
        // Lots 5,6,7: Same bidder (Swiss) on consecutive lots - edge case
        [2, 5],
        [3, 5],
        [4, 5],
        // Lot 10: Multiple bidders - high contention
        [5, 1],
        [5, 2],
        [5, 6],
        // Lot 12: French bidder
        [6, 3],
        // Lots 15-20: High density period
        [7, 9],  // German
        [8, 12], // English
        [9, 7],  // French/English with preferred caller (Marie)
        [10, 4], // Italian only - edge case (rare language)
        [11, 11], // German
        [12, 15], // German/English
        // Lot 25: Global collector (any language)
        [13, 8],
        // Lot 28: English
        [14, 6],
        // Lot 30: French with preference for Sophie (caller 6)
        [15, 14, 6],
        // Lot 35: Spanish
        [16, 10],
        // Lot 38: English
        [17, 2],
        // Lot 40: German
        [18, 9],
        // Lot 42: German/French
        [19, 13],
        // Lot 45: French
        [20, 3],
        // Lot 47: English
        [21, 12],
        // Lots 48,49,50: Mix
        [22, 1],
        [23, 15],
        [24, 5],
      ];

      let lotBidderId = 1;
      for (const [lotIndex, bidderId, preferredCallerId] of lotBidderAssignments) {
        await db.lotBidders.add({
          id: lotBidderId++,
          auctionId,
          lotId: lotIds[lotIndex]!,
          bidderId,
          preferredCallerId,
          status: "planned",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // ========== AUCTION CONFIG ==========
      await db.auctionConfigs.add({
        auctionId,
        lotGap: 5,
        prioritizePreferences: true,
        allowLanguageFallback: true,
        balanceWorkload: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  );
}

/**
 * Returns a description of what the demo data contains.
 */
export function getDemoDataDescription(): string {
  return `Evening Sale auction with:
• 10 Callers (various language skills)
• 15 Bidders (DE, EN, FR, IT, ES)
• 25 Lots (numbers 1-50)
• No pre-assignments - click "Auto-Assign" to run the algorithm
• Test scenarios: consecutive lots, language constraints, caller preferences`;
}
