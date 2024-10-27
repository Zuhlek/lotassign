"use client";
import { Button } from "@mui/material";
import { AssignmentLogic } from "@/lib/utils/assignmentLogic";
import { assignmentService } from "@/lib/services/assignment.service"; // import services
import { lotService } from "@/lib/services/lot.service";
import { auctionService } from "@/lib/services/auction.service";

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
