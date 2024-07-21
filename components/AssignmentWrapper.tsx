"use client";
import { getLotsForAuction, LotWithAssignmentsWithCallersAndBidders } from "@/lib/assignment/assignmentFunctions";
import { Box, Button } from "@mui/material";
import AssignmentList from "./AssignmentList";
import { useState } from "react";
import { assignCallersToDesiredBidders, assignCallersToBidders, removeAllCallerIdsFromAssignments } from "@/lib/assignment/assignmentActions";

interface AssignmentWrapperProps {
  auctionId: string;
  lots: LotWithAssignmentsWithCallersAndBidders[];
}

export default function AssignmentWrapper({ auctionId, lots }: AssignmentWrapperProps) {
  const [emptyLots, setEmptyAssignments] = useState<LotWithAssignmentsWithCallersAndBidders[]>(lots);
  const [desiredBidderLots, setDesiredBidderAssignments] = useState<LotWithAssignmentsWithCallersAndBidders[]>([]);
  const [remainingBidderLots, setRemainingBidderAssignments] = useState<LotWithAssignmentsWithCallersAndBidders[]>([]);

  const handleAssignCallersToDesiredBiddersClick = async () => {
    await assignCallersToDesiredBidders(auctionId);
    setDesiredBidderAssignments(await getLotsForAuction(auctionId));
  };

  const handleAssignCallersToRemainingBiddersClick = async () => {
    await assignCallersToBidders(auctionId);
    setRemainingBidderAssignments(await getLotsForAuction(auctionId));
  };

  const handleDeleteAllAssignmentsClick = async () => {
    await removeAllCallerIdsFromAssignments();
  };

  return (
    <Box>
      <Box>
        <Button onClick={handleDeleteAllAssignmentsClick}>Delete all</Button>
        <Button onClick={handleAssignCallersToDesiredBiddersClick}>DesiredCallers</Button>
        <Button onClick={handleAssignCallersToRemainingBiddersClick}>RemainingBidders</Button>
      </Box>
      <Box display="flex">
        {emptyLots.length > 0 && <AssignmentList title="Empty Assignments" lots={emptyLots} />}
        {desiredBidderLots.length > 0 && <AssignmentList title="Desired Assignments" lots={desiredBidderLots} />}
        {remainingBidderLots.length > 0 && <AssignmentList title="Remaining Assignments" lots={remainingBidderLots} />}
      </Box>
    </Box>
  );
}
