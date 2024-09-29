"use client";

import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import { BidderService } from "@/lib/services/bidder.service";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";
import { AuctionService } from "@/lib/services/auction.service";
import { useLiveQuery } from "dexie-react-hooks";
import PrioCallerAssignmentForm from "./prio-caller-assignment-form";
import PrioCallerAssignmentList from "./prio-caller-assignment-list";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { LotService } from "@/lib/services/lot.service";
import { Assignment } from "@/lib/models/assignment.model";
import { AssignmentService } from "@/lib/services/assignment.service";

interface PrioBidderSelectionListProps {
  auctionId: number;
}

export default function PrioBidderSelectionList({ auctionId }: PrioBidderSelectionListProps) {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [prioAssignments, setPrioAssignments] = useState<Map<number, number>>(new Map());

  const allCallers = useLiveQuery(() => AuctionService.getCallersForAuction(auctionId), [auctionId], []);
  const livePrioAssignments = useLiveQuery(() => PrioCallerAssignmentService.getPrioAssignmentsByAuctionId(auctionId), [auctionId], []);

  useEffect(() => {
    const fetchData = async () => {
      const lots = await LotService.getAllLotsByAuctionId(auctionId);

      const lotIds = lots.map((lot) => lot.id);
      let assignments: Assignment[] = [];
      for (const lotId of lotIds) {
        const lotAssignments = await AssignmentService.getAssignmentsByLotId(lotId);
        assignments = assignments.concat(lotAssignments);
      }

      const uniqueBidderIds = Array.from(new Set(assignments.map((a) => a.bidderId)));

      let bidders: Bidder[] = [];
      for (const id of uniqueBidderIds) {
        const bidder = await BidderService.getBidderById(id);
        if (bidder) {
          bidders.push(bidder);
        }
      }
      setBidders(bidders);

      if (livePrioAssignments) {
        const assignmentsMap = new Map<number, number>();
        livePrioAssignments.forEach((assignment) => {
          assignmentsMap.set(assignment.bidderId, assignment.callerId);
        });
        setPrioAssignments(assignmentsMap);
      }
    };

    fetchData();
  }, [auctionId, livePrioAssignments]);

  const handleCallerChange = (bidderId: number, callerId: number) => {
    const newPrioAssignments = new Map(prioAssignments);
    newPrioAssignments.set(bidderId, callerId);
    setPrioAssignments(newPrioAssignments);
  };

  // Verbesserte saveAssignments-Funktion
  const saveAssignments = async () => {
    if (prioAssignments) {
      // Überprüfen, ob es neue oder aktualisierte Zuordnungen gibt
      for (const [bidderId, callerId] of prioAssignments.entries()) {
        const existingAssignment = livePrioAssignments?.find(
          (assignment) => assignment.bidderId === bidderId && assignment.callerId === callerId
        );

        // Speichere nur, wenn es eine neue oder geänderte Zuordnung ist
        if (!existingAssignment) {
          await PrioCallerAssignmentService.createPrioAssignment({
            auctionId,
            bidderId,
            callerId,
          });
        }
      }
    }
    alert("Zuordnungen erfolgreich gespeichert.");
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <PrioCallerAssignmentForm
            bidders={bidders}
            allCallers={allCallers || []}
            prioAssignments={prioAssignments}
            handleCallerChange={handleCallerChange}
            saveAssignments={saveAssignments}
          />
        </Grid>
        <Grid item xs={5}>
          <PrioCallerAssignmentList
            prioAssignments={livePrioAssignments || []}
            bidders={bidders}
            callers={allCallers || []}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
