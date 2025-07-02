"use client"; 
import { loadAuctionAndCallerDummyData } from "@/lib/db/helpers";
import { Button } from "@mui/material";

export default function LoadAuctionDummyDataButton() {
  const run = async () => {
    loadAuctionAndCallerDummyData().catch((error) => {
      console.error("Failed to load dummy data:", error);
    });
  };

  return (
    <Button onClick={run} variant="contained" sx={{ margin: 1 }}>
      Load Auction and Caller Dummy Data
    </Button>
  );
}
