import CallersSelectionList from "@/components/workflow/caller-selection/callers-selection-list";
import ResetDbButton from "@/components/workflow/reset-db-button";
import { Box } from "@mui/material";
import LotAssignmentList from "@/components/workflow/lot-assignment-list/lot-assignment-list";
import RunAssignmentButton from "@/components/workflow/run-asssignment-button";
import ResetAssignmentsButton from "@/components/workflow/reset-assignments-button";

export default function AuctionDetailsPage({params}: {params: {auctionId: string}}) {

  return (
    <div>
      <Box>
        <CallersSelectionList></CallersSelectionList>
        <Box
          display="flex"
          sx={{ width: "100%", marginTop: 4, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
          justifyContent="center"
          bgcolor="lightsteelblue"
        >
          <ResetDbButton ></ResetDbButton>
          <RunAssignmentButton auctionId={Number(params.auctionId)}></RunAssignmentButton>
          <ResetAssignmentsButton auctionId={Number(params.auctionId)}></ResetAssignmentsButton>
        </Box>
        <LotAssignmentList></LotAssignmentList>
      </Box>
    </div>
  );
}
