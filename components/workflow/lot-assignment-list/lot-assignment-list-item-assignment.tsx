"use client";
import { Assignment } from "@/lib/models/assignment.model";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { BidderService } from "@/lib/services/bidder.service";
import { CallerService } from "@/lib/services/caller.service";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface LotAssignmentListItemAssignmentProps {
  assignment: Assignment;
}

export default function LotAssignmentListItemAssignment({ assignment }: LotAssignmentListItemAssignmentProps) {
  const [bidder, setBidder] = useState<Bidder | undefined>(undefined);
  const [caller, setCaller] = useState<Caller | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedBidder = await BidderService.getBidderById(assignment.bidderId);

        setBidder(fetchedBidder);

        if (assignment.callerId) {
          const fetchedCaller = await CallerService.getCallerById(assignment.callerId);
          setCaller(fetchedCaller);
        } else {
          setCaller(undefined);
        }
      } catch (error) {
        console.error("Failed to fetch bidder or caller:", error);
      }
    }

    fetchData();
  }, [assignment]);

  return (
    <Grid container>
      <Grid item xs={5}>
        <Typography align="right">{bidder ? bidder.name : "no bidder found"} 🧍</Typography>
      </Grid>
      <Grid item xs={2}>
        <Typography align="center"> ― </Typography>
      </Grid>
      <Grid item xs={5}>
        <Typography align="left"> 📞 {caller ? caller.name : "no caller found"}</Typography>
      </Grid>

    </Grid>
  );
}
