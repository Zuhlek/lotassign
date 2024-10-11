import React, { useState } from "react";
import { FormControl, InputLabel, MenuItem, Select, Button, Box, Grid } from "@mui/material";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";

interface PrioCallerAssignmentFormProps {
  availableBidders: Bidder[];
  availableCallers: Caller[];
  prioAssignments: Map<number, number>;
  onSaveAssignment: (bidderId: number, callerId: number) => void;  // Übergibt die IDs an die Elternkomponente
}

export default function PrioCallerAssignmentForm({
  availableBidders,
  availableCallers,
  prioAssignments,
  onSaveAssignment,
}: PrioCallerAssignmentFormProps) {
  const [selectedBidder, setSelectedBidder] = useState<number | "">("");
  const [selectedCaller, setSelectedCaller] = useState<number | "">("");

  // Filtere Callers, die bereits zugewiesen wurden, außer sie gehören zum aktuell ausgewählten Bidder
  const getAvailableCallers = (bidderId: number) => {
    const assignedCallers = Array.from(prioAssignments.values());
    return availableCallers.filter(
      (caller) => !assignedCallers.includes(caller.id!) || prioAssignments.get(bidderId) === caller.id
    );
  };

  return (
    <Box>
      <Grid container>
        <Grid item xs={9}>
          <Box sx={{ marginRight: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
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
            <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedBidder} size="small">
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
        </Grid>
        <Grid item xs={3}>
          <Button
            sx={{ marginLeft: 1 }}
            variant="outlined"
            size="small"
            onClick={() => {
              if (selectedBidder && selectedCaller) {
                onSaveAssignment(selectedBidder as number, selectedCaller as number);
                setSelectedBidder("");
                setSelectedCaller("");
              }
            }}
            disabled={!selectedBidder || !selectedCaller}
          >
            Prio erfassen
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
