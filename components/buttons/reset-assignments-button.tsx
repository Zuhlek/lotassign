"use client";
import { Button } from "@mui/material";
import { AssignmentLogic } from "@/lib/utils/assignmentLogic";

interface ResetAssignmentsButtonProps {
  auctionId: number;
}

export default function ResetAssignmentsButton({ auctionId }: ResetAssignmentsButtonProps) {

  const resetAssignments = async () => {
    const assignmentLogic = new AssignmentLogic(assignmentService, lotService, auctionService);
    await assignmentLogic.removeAllCallersFromAssignmentsByAuctionId(auctionId);
  };

  return (
    <Button onClick={resetAssignments} variant="contained" sx={{ margin: 1 }}>
      Reset Assignments
    </Button>
  );
}
