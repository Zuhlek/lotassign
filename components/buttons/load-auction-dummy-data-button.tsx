"use client";

import { loadAuctionAndCallerDummyData } from "@/lib/utils/db-helpers";
import { Button } from "@mui/material";
import { getAuctionById } from "@/lib/actions/auction.actions";
import { Auction } from "@/lib/models/auction.model";

interface LoadAuctionDummyDataButtonProps {
  onUploadComplete?: (newAuction: Auction) => void;
}

export default function LoadAuctionDummyDataButton({ onUploadComplete }: LoadAuctionDummyDataButtonProps) {
  const run = async () => {
    try {
      const auctionId = await loadAuctionAndCallerDummyData();
      const createdAuction = await getAuctionById(auctionId);
      if (createdAuction && onUploadComplete) {
        onUploadComplete(createdAuction);
      }
    } catch (error) {
      console.error("Failed to load dummy data:", error);
    }
  };

  return (
    <Button onClick={run} variant="contained" sx={{ margin: 1 }}>
      Load Auction and Caller Dummy Data
    </Button>
  );
}
