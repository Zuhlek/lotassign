"use client";
import { Button } from "@mui/material";
import { AssignmentLogic } from "@/lib/utils/assignmentLogic";

interface CreateAssignmentButtonProps {
  auctionId: number;
}

export default function CreateAssignmentButton({ auctionId }: CreateAssignmentButtonProps) {

  const createAssignments = async () => {

    const assignmentLogic = new AssignmentLogic(assignmentService, lotService, auctionService);
    
    await assignmentLogic.assignCallersToBidders(auctionId);
  };

  return (
    <Button onClick={createAssignments} variant="contained" sx={{ margin: 1 }}>
      Create Assignments
    </Button>
  );
}

