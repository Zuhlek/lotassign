"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Gavel, People, Storage } from "@mui/icons-material";

const navItems = [
  { label: "Auction", href: "/auction", icon: <Gavel fontSize="small" /> },
  { label: "Callers", href: "/callers", icon: <People fontSize="small" /> },
  { label: "Data", href: "/backups", icon: <Storage fontSize="small" /> },
];

function TopBar() {
  const pathname = usePathname();

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: 1201 }}>
      <Toolbar>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            LotAssign
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1, display: "flex", ml: 4, gap: 0.5 }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <Button
                  color="inherit"
                  startIcon={item.icon}
                  sx={{
                    opacity: isActive ? 1 : 0.8,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    borderRadius: 1,
                    px: 2,
                    "&:hover": {
                      opacity: 1,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
