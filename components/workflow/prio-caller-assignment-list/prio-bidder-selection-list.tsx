import React, { useState, useEffect } from "react";
import { Box, Button, Grid } from "@mui/material";
import PrioCallerAssignmentForm from "./prio-caller-assignment-form";
import PrioCallerAssignmentList from "./prio-caller-assignment-list";
import { useBiddersByAuctionId } from "@/hooks/useBiddersByAuctionId";
import { usePrioAssignments } from "@/hooks/usePrioAssignments";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";
import { useCallersForAuction } from "@/hooks/useCallersForAuction";

interface PrioBidderSelectionListProps {
  auctionId: number;
}

export default function PrioBidderSelectionList({ auctionId }: PrioBidderSelectionListProps) {
  const { bidders, isLoading: biddersLoading, error: biddersError } = useBiddersByAuctionId(auctionId);
  const { prioAssignments } = usePrioAssignments(auctionId);
  const { callers, isLoading: callersLoading, error: callersError } = useCallersForAuction(auctionId);

  const [selectedBidder, setSelectedBidder] = useState<number | "">("");
  const [selectedCaller, setSelectedCaller] = useState<number | "">("");

  const [prioAssignmentsMap, setPrioAssignmentsMap] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    if (prioAssignments) {
      const assignmentsMap = new Map<number, number>();
      prioAssignments.forEach((assignment) => {
        assignmentsMap.set(assignment.bidderId, assignment.callerId);
      });
      setPrioAssignmentsMap(assignmentsMap);
    }
  }, [prioAssignments]);

  const handleSaveAssignment = async (bidderId: number, callerId: number) => {
    const newPrioAssignments = new Map(prioAssignmentsMap);
    newPrioAssignments.set(bidderId, callerId);
    setPrioAssignmentsMap(newPrioAssignments);

    await PrioCallerAssignmentService.createPrioAssignment({
      auctionId,
      bidderId,
      callerId,
    });

    setSelectedBidder("");
    setSelectedCaller("");
  };

  const getAvailableBidders = () => {
    const assignedBidders = Array.from(prioAssignmentsMap.keys());
    return bidders.filter((bidder) => !assignedBidders.includes(bidder.id!));
  };

  if (biddersLoading || callersLoading) {
    return <div>Loading...</div>;
  }

  if (biddersError || callersError) {
    return <div>Error: {biddersError || callersError}</div>;
  }

  return (
    <Box>
      <Grid container>
        <Grid item xs={5}>
          <PrioCallerAssignmentForm
            availableBidders={getAvailableBidders()}
            availableCallers={callers || []}
            prioAssignments={prioAssignmentsMap}
            selectedBidder={selectedBidder}
            selectedCaller={selectedCaller}
            setSelectedBidder={setSelectedBidder}
            setSelectedCaller={setSelectedCaller}
          />
        </Grid>
        <Grid item xs={2}>
          <Box display="flex" justifyContent="center" alignContent="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                if (selectedBidder && selectedCaller) handleSaveAssignment(selectedBidder as number, selectedCaller as number);
              }}
              disabled={!selectedBidder || !selectedCaller}
            >
              +
            </Button>
          </Box>
        </Grid>
        <Grid item xs={5}>
          <PrioCallerAssignmentList prioAssignments={prioAssignments || []} bidders={bidders} callers={callers || []} />
        </Grid>
      </Grid>
    </Box>
  );
}
