"use server";

import { db } from "@/lib/db/dexie.db";
import { AuctionConfig } from "@/lib/models/auction-config.model";

export async function getOrCreateAuctionConfig(auctionId: number): Promise<AuctionConfig> {
  const existing = await db.auctionConfigs
    .where("auctionId")
    .equals(auctionId)
    .first();

  if (existing) {
    return AuctionConfig.fromJSON(existing);
  }

  const config = AuctionConfig.createDefault(auctionId);
  const id = await db.auctionConfigs.add(config.toJSON());
  config.id = id;
  return config;
}

export async function getAuctionConfig(auctionId: number): Promise<AuctionConfig | null> {
  const existing = await db.auctionConfigs
    .where("auctionId")
    .equals(auctionId)
    .first();

  return existing ? AuctionConfig.fromJSON(existing) : null;
}

export async function updateAuctionConfig(config: AuctionConfig): Promise<void> {
  if (config.id === undefined) throw new Error("Config ID required");
  config.updatedAt = new Date();
  await db.auctionConfigs.put(config.toJSON());
}

export async function deleteAuctionConfig(auctionId: number): Promise<void> {
  await db.auctionConfigs.where("auctionId").equals(auctionId).delete();
}
