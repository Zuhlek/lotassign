import Dexie, { type EntityTable } from 'dexie';
import { Lot } from '@/lib/models/lot.model';
import { Bidder } from '@/lib/models/bidder.model';
import { Caller } from '@/lib/models/caller.model';
import { Assignment } from '@/lib/models/assignment.model';
import { Auction } from '@/lib/models/auction.model';


const db = new Dexie('LotAssignDB') as Dexie & {
  auctions: EntityTable<Auction, 'id'>;
  lots: EntityTable<Lot, 'id'>;
  bidders: EntityTable<Bidder, 'id'>;
  callers: EntityTable<Caller, 'id'>;
  assignments: EntityTable<Assignment, 'id'>;
};

db.version(1).stores({
  lots: '++id,number,description,auctionId',
  bidders: '++id,name,languages,phoneNumber',
  callers: '++id,name,abbreviation,languages',
  assignments: '++id,lotId,bidderId,callerId,isFinal'
});

export { db };
