import { z } from "zod";

export class AuctionConfig {
  id?: number;
  auctionId: number;
  lotGap: number;
  prioritizePreferences: boolean;
  allowLanguageFallback: boolean;
  balanceWorkload: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    auctionId: number,
    lotGap: number = 5,
    prioritizePreferences: boolean = true,
    allowLanguageFallback: boolean = true,
    balanceWorkload: boolean = true,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.auctionId = auctionId;
    this.lotGap = lotGap;
    this.prioritizePreferences = prioritizePreferences;
    this.allowLanguageFallback = allowLanguageFallback;
    this.balanceWorkload = balanceWorkload;
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  static fromJSON(json: AuctionConfigJSON): AuctionConfig {
    const parsed = AuctionConfigSchema.parse(json);
    return new AuctionConfig(
      parsed.auctionId,
      parsed.lotGap,
      parsed.prioritizePreferences,
      parsed.allowLanguageFallback,
      parsed.balanceWorkload,
      parsed.id,
      parsed.createdAt ? new Date(parsed.createdAt) : undefined,
      parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
    );
  }

  toJSON(): AuctionConfigJSON {
    return {
      id: this.id,
      auctionId: this.auctionId,
      lotGap: this.lotGap,
      prioritizePreferences: this.prioritizePreferences,
      allowLanguageFallback: this.allowLanguageFallback,
      balanceWorkload: this.balanceWorkload,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static createDefault(auctionId: number): AuctionConfig {
    return new AuctionConfig(auctionId);
  }
}

export const AuctionConfigSchema = z.object({
  id: z.number().optional(),
  auctionId: z.number(),
  lotGap: z.number().min(0).max(50).default(5),
  prioritizePreferences: z.boolean().default(true),
  allowLanguageFallback: z.boolean().default(true),
  balanceWorkload: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export interface AuctionConfigJSON {
  id?: number;
  auctionId: number;
  lotGap: number;
  prioritizePreferences: boolean;
  allowLanguageFallback: boolean;
  balanceWorkload: boolean;
  createdAt?: string;
  updatedAt?: string;
}
