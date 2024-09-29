import React, { useState } from "react";
import { FormControl, InputLabel, MenuItem, Select, Button, Box, Typography, Grid } from "@mui/material";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";

interface PrioCallerAssignmentFormProps {
  bidders: Bidder[];
  allCallers: Caller[];
  prioAssignments: Map<number, number>;
  handleCallerChange: (bidderId: number, callerId: number) => void;
  saveAssignments: () => void;
}

export default function PrioCallerAssignmentForm({
  bidders,
  allCallers,
  prioAssignments,
  handleCallerChange,
  saveAssignments,
}: PrioCallerAssignmentFormProps) {
  const [selectedBidder, setSelectedBidder] = useState<number | "">("");
  const [selectedCaller, setSelectedCaller] = useState<number | "">("");

  const getAvailableCallers = (bidderId: number) => {
    const assignedCallers = Array.from(prioAssignments.values());

    return allCallers.filter((caller) => {
      if (!caller.id) return false;
      return !assignedCallers.includes(caller.id) || prioAssignments.get(bidderId) === caller.id;
    });
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
                {bidders.map((bidder) => (
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
        <Grid item xs={3} >
          <Button
          sx={{marginLeft:1}}
            variant="outlined"
            size="small"
            onClick={() => {
              if (selectedBidder && selectedCaller) {
                handleCallerChange(selectedBidder, selectedCaller);
                saveAssignments();
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
