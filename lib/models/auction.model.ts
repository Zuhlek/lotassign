import { Caller } from "@/lib/models/caller.model";
import { Lot } from "@/lib/models/lot.model";

export class Auction {
  public id?: number;
  public name: string;
  public date: Date;
  public lots?: Lot[];
  public callers?: Caller[];

  constructor(
    id: number | undefined,
    name: string,
    date: Date,
    lots?: Lot[],
    callers?: Caller[]
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.lots = lots;
    this.callers = callers;
  }

  toDDMMYYYY(): string {
    const day = this.date.getDate();
    const month = this.date.getMonth() + 1;
    const year = this.date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
