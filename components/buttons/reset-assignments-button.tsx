"use client";
import { Button } from "@mui/material";
import { AssignmentLogic } from "@/lib/utils/assignmentLogic";
import { AssignmentService } from "@/lib/services/assignment.service"; // import services
import { LotService } from "@/lib/services/lot.service";
import { AuctionService } from "@/lib/services/auction.service";

interface ResetAssignmentsButtonProps {
  auctionId: number;
}

export default function ResetAssignmentsButton({ auctionId }: ResetAssignmentsButtonProps) {

  const resetAssignments = async () => {

    const assignmentLogic = new AssignmentLogic(AssignmentService, LotService, AuctionService);
    
    await assignmentLogic.removeAllCallersFromAssignmentsByAuctionId(auctionId);
  };

  return (
    <Button onClick={resetAssignments} variant="contained" sx={{ margin: 1 }}>
      Reset Assignments
    </Button>
  );
}
