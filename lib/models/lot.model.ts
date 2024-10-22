import { Assignment } from "@/lib/models/assignment.model";

export class Lot {
  public id?: number | undefined;
  public auctionId: number; 
  public number: number;
  public description: string;
  public assignments?: Assignment[];

  constructor(
    id: number | undefined,
    auctionId: number,
    number: number,
    description: string,
    assignments?: Assignment[]
  ) {
    this.id = id;
    this.auctionId = auctionId;
    this.number = number;
    this.description = description;
    this.assignments = assignments;
  }
}
