import { Lot } from '@/lib/models/lot.model';

export class LotDTO {
  id?: number;
  auctionId: number;
  number: number;
  description: string;
  assignmentIds: number[];

  constructor(
    auctionId: number,
    number: number,
    description: string,
    assignmentIds: number[] = [],
    id?: number
  ) {
    this.id = id;
    this.auctionId = auctionId;
    this.number = number;
    this.description = description;
    this.assignmentIds = assignmentIds;
  }

  static fromModel(lot: Lot): LotDTO {
    return new LotDTO(
      lot.auctionId,
      lot.number,
      lot.description,
      lot.assignmentIds,
      lot.id
    );
  }

  static fromData(data: any): LotDTO {
    return new LotDTO(
      data.auctionId,
      data.number,
      data.description,
      data.assignmentIds || [],
      data.id
    );
  }

  toModel(): Lot {
    return new Lot(
      this.id,
      this.auctionId,
      this.number,
      this.description,
      this.assignmentIds,
      undefined
    );
  }
}
