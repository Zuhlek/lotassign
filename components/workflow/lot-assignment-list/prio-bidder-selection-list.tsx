"use client";

import React, { useEffect, useState } from "react";
import { LotService } from "@/lib/services/lot.service";
import { AssignmentService } from "@/lib/services/assignment.service";
import { BidderService } from "@/lib/services/bidder.service";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";
import { FormControl, InputLabel, MenuItem, Select, Button, Box, Typography } from "@mui/material";
import { Assignment } from "@/lib/models/assignment.model";
import { Bidder } from "@/lib/models/bidder.model";
import { PrioCallerAssignment } from "@/lib/models/prioCallerAssignment";
import { AuctionService } from "@/lib/services/auction.service";
import { useLiveQuery } from "dexie-react-hooks";

interface PrioBidderSelectionListProps {
  auctionId: number;
}

export default function PrioBidderSelectionList({ auctionId }: PrioBidderSelectionListProps) {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [prioAssignments, setPrioAssignments] = useState<Map<number, number>>(new Map());

  // Verwende liveQuery, um die Callers dynamisch zu laden
  const allCallers = useLiveQuery(() => AuctionService.getCallersForAuction(auctionId), [auctionId], []);

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

      const existingAssignments = await PrioCallerAssignmentService.getPrioAssignmentsByAuctionId(auctionId);
      const assignmentsMap = new Map();
      existingAssignments.forEach((assignment: PrioCallerAssignment) => {
        assignmentsMap.set(assignment.bidderId, assignment.callerId);
      });
      setPrioAssignments(assignmentsMap);
    };

    fetchData();
  }, [auctionId]);

  const handleCallerChange = (bidderId: number, callerId: number | "") => {
    const newPrioAssignments = new Map(prioAssignments);

    // Entferne die alte Zuordnung, wenn ein Caller bereits zugewiesen war
    const previousCallerId = prioAssignments.get(bidderId);
    if (previousCallerId && previousCallerId !== callerId) {
      // Alte Zuordnung entfernen
      newPrioAssignments.forEach((assignedCallerId, bId) => {
        if (assignedCallerId === previousCallerId) {
          newPrioAssignments.delete(bId);
        }
      });
    }

    if (callerId !== "") {
      // Neue Zuordnung hinzufügen
      newPrioAssignments.set(bidderId, callerId as number);
    } else {
      // Entfernen der Zuordnung, wenn kein Caller ausgewählt ist
      newPrioAssignments.delete(bidderId);
    }

    setPrioAssignments(newPrioAssignments);
  };

  const saveAssignments = async () => {
    for (const [bidderId, callerId] of prioAssignments.entries()) {
      await PrioCallerAssignmentService.createPrioAssignment({
        auctionId,
        bidderId,
        callerId,
      });
    }
    alert("Zuordnungen erfolgreich gespeichert.");
  };

  const getAvailableCallers = (bidderId: number) => {
    // Erstelle eine Liste der Callers, die noch nicht zugewiesen wurden, oder dem aktuellen Bidder zugewiesen sind
    const assignedCallers = Array.from(prioAssignments.values());
  
    return allCallers?.filter((caller) => {
      // Überprüfen, ob der Caller dem aktuellen Bidder zugewiesen ist oder noch nicht zugewiesen wurde
      if(!caller.id) return false;
      return !assignedCallers.includes(caller.id) || prioAssignments.get(bidderId) === caller.id;
    });
  };
  

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Prio Caller Zuweisung
      </Typography>
      {bidders.map((bidder) =>
        bidder.id ? (
          <Box key={bidder.id} sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            <Typography sx={{ marginRight: 2 }}>{bidder.name}</Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id={`caller-select-label-${bidder.id}`}>Caller</InputLabel>
              <Select
                labelId={`caller-select-label-${bidder.id}`}
                id={`caller-select-${bidder.id}`}
                value={prioAssignments.get(bidder.id) || ""}
                label="Caller"
                onChange={(e) => {
                  const selectedCallerId = e.target.value as number | "";
                  if (typeof bidder.id === "number") {
                    handleCallerChange(bidder.id, selectedCallerId);
                  }
                }}
              >
                {getAvailableCallers(bidder.id)?.map((caller) => (
                  <MenuItem key={caller.id} value={caller.id}>
                    {caller.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null
      )}
      <Button variant="contained" onClick={saveAssignments}>
        Zuordnungen speichern
      </Button>
    </Box>
  );
}
