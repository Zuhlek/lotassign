import CallersSelectionList from "@/components/workflow/caller-selection/callers-selection-list";
import { Box } from "@mui/material";
import LotAssignmentList from "@/components/workflow/lot-assignment-list/lot-assignment-list";
import RunAssignmentButton from "@/components/workflow/buttons/run-asssignment-button";
import ResetAssignmentsButton from "@/components/workflow/buttons/reset-assignments-button";
import UploadBidderDataButton from "@/components/workflow/buttons/upload-bidder-data-button";
import LoadLotsDummyDataButton from "@/components/workflow/buttons/load-lots-dummy-data-button";

export default function AuctionDetailsPage({params}: {params: {auctionId: string}}) {

  const auctionId = Number(params.auctionId);

  return (
    <div>
      <Box>
        <CallersSelectionList></CallersSelectionList>
        <Box
          display="flex"
          sx={{ width: "100%", marginTop: 2, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
          justifyContent="center"
          bgcolor="lightsteelblue"
        >
          <LoadLotsDummyDataButton auctionId={auctionId}></LoadLotsDummyDataButton>
          <RunAssignmentButton auctionId={auctionId}></RunAssignmentButton>
          <ResetAssignmentsButton auctionId={auctionId}></ResetAssignmentsButton>
          <UploadBidderDataButton auctionId={auctionId}></UploadBidderDataButton>
        </Box>
        <LotAssignmentList></LotAssignmentList>
      </Box>
    </div>
  );
}
