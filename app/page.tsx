import { Box } from "@mui/material";
import Link from "next/link";

export default function HomePage() {

  return (
    <Box>
      <Link href="/auction"> Go To Auctions </Link>
    </Box>
  );
}
