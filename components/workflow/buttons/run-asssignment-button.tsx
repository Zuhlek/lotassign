"use client";
import { assignCallersToBidders } from "@/lib/assignmentLogic";
import { Button } from "@mui/material";

interface RunAssignmentButtonProps{
    auctionId: number;
}

export default function RunAssignmentButton({auctionId}: RunAssignmentButtonProps) {
  const runAssignment = async () => {
    assignCallersToBidders(auctionId)
  };

  return (
    <Button onClick={runAssignment} variant="contained" sx={{ margin: 1 }}>
      Run assignment for auctionId {auctionId}
    </Button>
  );
}
