export interface Auction {
  id?: number;
  name: string;
  date: Date;
  lots?: number[];
  callers?: number[];
}
