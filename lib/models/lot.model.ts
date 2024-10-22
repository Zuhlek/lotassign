import { Assignment } from "@/lib/models/assignment.model";

export class Lot {
  public id?: number;
  public auctionId: number;
  public number: number;
  public description: string;
  public assignmentIds: number[];
  public assignments?: Assignment[];

  constructor(
    id: number | undefined,
    auctionId: number,
    number: number,
    description: string,
    assignmentIds: number[] = [],
    assignments?: Assignment[]
  ) {
    this.id = id;
    this.auctionId = auctionId;
    this.number = number;
    this.description = description;
    this.assignmentIds = assignmentIds;
    this.assignments = assignments;
  }
}
