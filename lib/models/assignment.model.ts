import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { Lot } from "@/lib/models/lot.model";

export class Assignment {
  public id?: number;
  public caller?: Caller;
  public lot: Lot;
  public bidder: Bidder;
  public isFinal: boolean;

  constructor(
    id: number | undefined,
    caller: Caller | undefined,
    lot: Lot,
    bidder: Bidder,
    isFinal: boolean
  ) {
    this.id = id;
    this.caller = caller;
    this.lot = lot;
    this.bidder = bidder;
    this.isFinal = isFinal;
  }
}
