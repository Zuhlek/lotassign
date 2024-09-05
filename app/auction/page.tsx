import { Box } from "@mui/material";
import AuctionList from "@/components/auction/auction-list";
import ResetDbButton from "@/components/workflow/buttons/reset-db-button";
import LoadAuctionDummyDataButton from "@/components/workflow/buttons/load-auction-dummy-data-button";

export default function AuctionPage() {
  return (
    <Box>
      <Box
        display="flex"
        sx={{ width: "100%", marginTop: 4, marginBottom: 4, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
        justifyContent="center"
        bgcolor="lightsteelblue"
      >
        <ResetDbButton></ResetDbButton>
        <LoadAuctionDummyDataButton></LoadAuctionDummyDataButton>
      </Box>
      <AuctionList></AuctionList>
    </Box>
  );
}
