import { Box } from "@mui/material";
import AuctionList from "@/components/auction/auction-list";
import ResetDbButton from "@/components/workflow/reset-db-button";

export default function AuctionPage() {
  return (
    <Box>
      <ResetDbButton></ResetDbButton>
      <AuctionList></AuctionList>
    </Box>
  );
}
