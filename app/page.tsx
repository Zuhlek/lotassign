import DataIntegrityChecker from "@/components/DataIntegrityChecker";
import { Box, Button } from "@mui/material";
import Link from "next/link";

export default function HomePage() {
  return (
    <Box display="flex" sx={{ flexDirection: "column" }} justifyContent="center">
      <Box display="flex" justifyContent="center" sx={{margin:4}}>
        <Link href="/callers" passHref>
          <Button variant="contained" disableElevation size="large" sx={{margin:2}}>
            Callers
          </Button>
        </Link>
        <Link href="/auction" passHref >
          <Button variant="contained" disableElevation size="large" sx={{margin:2}}>
            Auctions
          </Button>
        </Link>
        <Link href="/backups" passHref>
          <Button variant="contained" disableElevation size="large" sx={{margin:2}}>
            Backups
          </Button>
        </Link>
      </Box>
      <Box display="flex" justifyContent="center">
        <DataIntegrityChecker />
      </Box>
    </Box>
  );
}
