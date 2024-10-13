"use client";
import { db } from "@/lib/db/dexie.db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "next/navigation";
import LotAssignmentListItem from "./lot-assignment-list-item";
import { Box, Grid, Typography } from "@mui/material";
import LotAnalysisDashboard from "./lot-analysis-dashboard";
import { useLotsByAuctionId } from "@/hooks/useLotsByAuctionId";

export default function LotAssignmentList() {
  const auctionId = Number(useParams().auctionId);

  const { lots, isLoading, error} = useLotsByAuctionId(auctionId);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {lots && lots.map((lot) => (
          <Grid item xs={4} key={lot.id} >
            <LotAssignmentListItem lot={lot}></LotAssignmentListItem>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
