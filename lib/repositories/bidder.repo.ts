import {db} from '@/lib/db/dexie.db';
import { Bidder } from '@/lib/models/bidder.model';

class BidderRepo {

    async createBidder(bidder: Bidder): Promise<number> {
        const newBidderId = await db.bidders.add(bidder);
        return newBidderId ? newBidderId : -1;
    }

    async getBidderById(id: number): Promise<Bidder | null> {
        const bidder = await db.bidders.get(id);
        if (!bidder) return null;
        return new Bidder(bidder.id, bidder.name, bidder.languages, bidder.phoneNumber);
    }

    async getBidders(): Promise<Bidder[]> {
        const bidders = await db.bidders.toArray();
        return bidders.map(b => new Bidder(b.id, b.name, b.languages, b.phoneNumber));
    }

    async updateBidder(id: number, bidder: Bidder): Promise<number> {
        return await db.bidders.update(id, {
            name: bidder.name,
            languages: bidder.languages,
            phoneNumber: bidder.phoneNumber
        });
    }

    async deleteBidder(id: number): Promise<void> {
        await db.bidders.delete(id);
    }

}

export const bidderRepo = new BidderRepo();