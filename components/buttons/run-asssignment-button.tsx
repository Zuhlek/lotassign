"use client";
import { Button } from "@mui/material";
import { AssignmentLogic } from "@/lib/utils/assignmentLogic";
import { AssignmentService } from "@/lib/services/assignment.service"; // import services
import { LotService } from "@/lib/services/lot.service";
import { AuctionService } from "@/lib/services/auction.service";

interface CreateAssignmentButtonProps {
  auctionId: number;
}

export default function CreateAssignmentButton({ auctionId }: CreateAssignmentButtonProps) {

  const createAssignments = async () => {

    const assignmentLogic = new AssignmentLogic(AssignmentService, LotService, AuctionService);
    
    await assignmentLogic.assignCallersToBidders(auctionId);
  };

  return (
    <Button onClick={createAssignments} variant="contained" sx={{ margin: 1 }}>
      Create Assignments
    </Button>
  );
}

