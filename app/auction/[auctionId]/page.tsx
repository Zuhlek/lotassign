import CallersSelectionList from "@/components/workflow/caller-selection/callers-selection-list";
import { Box, Typography } from "@mui/material";
import LotAssignmentList from "@/components/workflow/lot-assignment-list/lot-assignment-list";
import RunAssignmentButton from "@/components/workflow/buttons/run-asssignment-button";
import ResetAssignmentsButton from "@/components/workflow/buttons/reset-assignments-button";
import LoadLotsDummyDataButton from "@/components/workflow/buttons/load-lots-dummy-data-button";
import UploadExcelDataButton from "@/components/workflow/buttons/upload-excel-data-button";
import PrioBidderSelectionList from "@/components/workflow/prio-caller-assignment-list/prio-bidder-selection-list";

export default function AuctionDetailsPage({ params }: { params: { auctionId: string } }) {
  const auctionId = Number(params.auctionId);

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
        <CallersSelectionList></CallersSelectionList>
        <Box
          display="flex"
          sx={{ width: "100%", marginBottom: 1, paddingLeft: 1, marginTop:4, borderRadius: 1 }}
          justifyContent="left"
          bgcolor="navajowhite"
        >
          <Typography variant="overline">II. Prios setzen</Typography>
        </Box>
        <PrioBidderSelectionList auctionId={auctionId}></PrioBidderSelectionList>
        <Box
          display="flex"
          sx={{ width: "100%", marginBottom: 1, paddingLeft: 1, marginTop:4, borderRadius: 1 }}
          justifyContent="left"
          bgcolor="navajowhite"
        >
          <Typography variant="overline">III. Zuweisungen ermitteln</Typography>
        </Box>
        <Box
          display="flex"
          sx={{ width: "100%",}}
          justifyContent="center"
        >
          <LoadLotsDummyDataButton auctionId={auctionId}></LoadLotsDummyDataButton>
          <RunAssignmentButton auctionId={auctionId}></RunAssignmentButton>
          <ResetAssignmentsButton auctionId={auctionId}></ResetAssignmentsButton>
          <UploadExcelDataButton auctionId={auctionId} uploadModel="Bidder"></UploadExcelDataButton>
        </Box>
        <LotAssignmentList></LotAssignmentList>
      </Box>
    </div>
  );
}
