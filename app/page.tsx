import { CreateCallerForm } from "@/components/caller/create-caller-form";
import { Box } from "@mui/material";
import React from "react";

export default async function HomePage() {
  //const auction = await prisma.auction.findFirst();
  //if (!auction) {
  //   return <Typography>No auction found</Typography>;
  //}
  //const lots = await getLotsForAuction(auction.id);
  //<AssignmentWrapper auctionId={auction.id} lots={lots}></AssignmentWrapper>

  return (
    <div>
      <Box display="flex"></Box>
      <CreateCallerForm />
    </div>
  );
}
