import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import PrioCallerAssignmentForm from "./prio-caller-assignment-form";
import PrioCallerAssignmentList from "./prio-caller-assignment-list";
import { useBiddersByAuctionId } from "@/hooks/useBiddersByAuctionId";
import { useCallers } from "@/hooks/useCallers";
import { usePrioAssignments } from "@/hooks/usePrioAssignments";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";
import { useCallersForAuction } from "@/lib/services/useCallersForAuction";

interface PrioBidderSelectionListProps {
  auctionId: number;
}

export default function PrioBidderSelectionList({ auctionId }: PrioBidderSelectionListProps) {
  const { bidders, isLoading: biddersLoading, error: biddersError } = useBiddersByAuctionId(auctionId);
  const { prioAssignments } = usePrioAssignments(auctionId);
  const { callers, isLoading: callersLoading, error: callersError } = useCallersForAuction(auctionId);


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

  // Funktion, um die Zuweisung eines Bidders und eines Callers zu speichern
  const handleSaveAssignment = async (bidderId: number, callerId: number) => {
    // Aktualisiere den lokalen Zustand
    const newPrioAssignments = new Map(prioAssignmentsMap);
    newPrioAssignments.set(bidderId, callerId);
    setPrioAssignmentsMap(newPrioAssignments);

    // Speicher die neue Zuweisung in der Datenbank
    await PrioCallerAssignmentService.createPrioAssignment({
      auctionId,
      bidderId,
      callerId,
    });
  };

  // Verfügbare Bidders ermitteln, die noch keinen Caller haben
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
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <PrioCallerAssignmentForm
            availableBidders={getAvailableBidders()}
            availableCallers={callers || []}
            prioAssignments={prioAssignmentsMap}
            onSaveAssignment={handleSaveAssignment}  // Übergebe die Save-Funktion
          />
        </Grid>
        <Grid item xs={5}>
          <PrioCallerAssignmentList
            prioAssignments={prioAssignments || []}
            bidders={bidders}
            callers={callers || []}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
