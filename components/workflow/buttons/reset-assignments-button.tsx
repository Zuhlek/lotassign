"use client";
import { removeAllCallersFromAssignmentsByAuctionId } from "@/lib/utils/assignmentLogic";
import { Button } from "@mui/material";

interface ResetAssignmentsButtonProps{
    auctionId: number;
}

export default function ResetAssignmentsButton({auctionId}: ResetAssignmentsButtonProps) {
  const runAssignment = async () => {
    removeAllCallersFromAssignmentsByAuctionId(auctionId)
  };

  return (
    <Button onClick={runAssignment} variant="contained" sx={{ margin: 1 }}>
      Reset Assignments
    </Button>
  );
}
