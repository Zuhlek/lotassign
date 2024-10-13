"use client";
import { loadLotsBiddersAndAssignmentsDummyData } from "@/lib/db/dexie.db";
import { Button } from "@mui/material";

interface ResetDbButtonProps{
  auctionId: number;
}

export default function ResetDbButton({auctionId}: ResetDbButtonProps) {
  const resetDB = async () => {
    loadLotsBiddersAndAssignmentsDummyData(auctionId).catch((error) => {
      console.error("Failed to load dummy data:", error);
    });
  };

  return (
    <Button onClick={resetDB} variant="contained" sx={{ margin: 1 }}>
      Load Lots, Bidders, and Assignments Dummy Data
    </Button>
  );
}
