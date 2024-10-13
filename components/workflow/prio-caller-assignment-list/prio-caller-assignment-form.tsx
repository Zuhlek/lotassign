import React, { useState } from "react";
import { FormControl, InputLabel, MenuItem, Select, Button, Box, Grid } from "@mui/material";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";

interface PrioCallerAssignmentFormProps {
  availableBidders: Bidder[];
  availableCallers: Caller[];
  prioAssignments: Map<number, number>;
  selectedBidder: number | "";
  selectedCaller: number | "";
  setSelectedBidder: (bidderId: number) => void;
  setSelectedCaller: (callerId: number) => void;
}

export default function PrioCallerAssignmentForm({
  availableBidders,
  availableCallers,
  prioAssignments,
  selectedBidder,
  selectedCaller,
  setSelectedBidder,
  setSelectedCaller,
}: PrioCallerAssignmentFormProps) {
  
  const getAvailableCallers = (bidderId: number) => {
    const assignedCallers = Array.from(prioAssignments.values());
    return availableCallers.filter((caller) => !assignedCallers.includes(caller.id!) || prioAssignments.get(bidderId) === caller.id);
  };

  return (
    <Box display="flex" justifyContent="center" alignContent="center">
      <FormControl fullWidth size="small">
        <InputLabel id="bidder-select-label">Bidder</InputLabel>
        <Select
          labelId="bidder-select-label"
          id="bidder-select"
          value={selectedBidder}
          label="Bidder"
          onChange={(e) => setSelectedBidder(e.target.value as number)}
        >
          {availableBidders.map((bidder) => (
            <MenuItem key={bidder.id} value={bidder.id}>
              {bidder.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth disabled={!selectedBidder} size="small">
        <InputLabel id="caller-select-label">Caller</InputLabel>
        <Select
          labelId="caller-select-label"
          id="caller-select"
          value={selectedCaller}
          label="Caller"
          onChange={(e) => setSelectedCaller(e.target.value as number)}
        >
          {selectedBidder &&
            getAvailableCallers(selectedBidder).map((caller) => (
              <MenuItem key={caller.id} value={caller.id}>
                {caller.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}
