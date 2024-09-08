"use client"; 
import { loadAuctionAndCallerDummyData } from "@/lib/db/dexie.db";
import { Button } from "@mui/material";

export default function ResetDbButton() {
  const resetDB = async () => {
    loadAuctionAndCallerDummyData().catch((error) => {
      console.error("Failed to load dummy data:", error);
    });
  };

  return (
    <Button onClick={resetDB} variant="contained" sx={{ margin: 1 }}>
      Load Auction and Caller Dummy Data
    </Button>
  );
}
