"use client";
import CallersSelectionList from "@/components/workflow/caller-selection/callers-selection-list";
import { Box, Typography } from "@mui/material";
import LotAssignmentList from "@/components/workflow/lot-assignment-list/lot-assignment-list";
import CreateAssignmentButton from "@/components/buttons/run-asssignment-button";
import ResetAssignmentsButton from "@/components/buttons/reset-assignments-button";
import LoadLotsDummyDataButton from "@/components/buttons/load-lots-dummy-data-button";
import UploadExcelDataButton from "@/components/buttons/upload-caller-data-button";
import PrioBidderSelectionList from "@/components/workflow/prio-caller-assignment-list/prio-bidder-selection-list";
import { useAuctionById } from "@/hooks/useAuctionById"; 
import { useCallers } from "@/hooks/useCallers"; 

export default function AuctionDetailsPage({ params }: { params: { auctionId: string } }) {
  const auctionId = Number(params.auctionId);

  const { auction, isLoading: auctionLoading, error: auctionError } = useAuctionById(auctionId);
  const { callers, isLoading: callersLoading, error: callersError } = useCallers();

  if (auctionLoading || callersLoading) {
    return <div>Loading...</div>;
  } else if (auctionError || callersError) {
    return <div>Error: {auctionError || callersError}</div>;
  } else if (auction && callers) {
    return (
      <div>
        <Box>
          <Box
            display="flex"
            sx={{ width: "100%", marginBottom: 1, paddingLeft: 1, borderRadius: 1 }}
            justifyContent="left"
            bgcolor="navajowhite"
          >
            <Typography variant="overline">I. Telefonisten wählen</Typography>
          </Box>
          <CallersSelectionList auction={auction} callers={callers}></CallersSelectionList>
          <Box
            display="flex"
            sx={{ width: "100%", marginBottom: 1, paddingLeft: 1, marginTop: 4, borderRadius: 1 }}
            justifyContent="left"
            bgcolor="navajowhite"
          >
            <Typography variant="overline">II. Prios setzen</Typography>
          </Box>
          <PrioBidderSelectionList auctionId={auctionId}></PrioBidderSelectionList>

          <Box
            display="flex"
            sx={{ width: "100%", marginBottom: 1, paddingLeft: 1, marginTop: 4, borderRadius: 1 }}
            justifyContent="left"
            bgcolor="navajowhite"
          >
            <Typography variant="overline">III. Zuweisungen ermitteln</Typography>
          </Box>
          <Box display="flex" sx={{ width: "100%" }} justifyContent="center">
            <LoadLotsDummyDataButton auctionId={auctionId}></LoadLotsDummyDataButton>
            <CreateAssignmentButton auctionId={auctionId}></CreateAssignmentButton>
            <ResetAssignmentsButton auctionId={auctionId}></ResetAssignmentsButton>
            <UploadExcelDataButton auctionId={auctionId} uploadModel="Bidder"></UploadExcelDataButton>
          </Box>
          <LotAssignmentList></LotAssignmentList>
        </Box>
      </div>
    );
  }
}
