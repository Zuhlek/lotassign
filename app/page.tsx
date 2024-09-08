import DataIntegrityChecker from "@/components/DataIntegrityChecker";
import { Box, Button } from "@mui/material";
import Link from "next/link";

export default function HomePage() {

  return (
    <Box>
      <DataIntegrityChecker />
      <p></p>

      <Link href="/auction" passHref>
        <Button variant="contained" disableElevation size='large'>Go To Auctions</Button>
      </Link>
      <p></p>
      <Link href="/callers" passHref>
        <Button variant="contained" disableElevation size='large'>Go To Callers</Button>
      </Link>

    </Box>
  );
}
