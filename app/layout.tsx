import { Inter } from "next/font/google";
import TopBar from "@/components/layout/topbar";
import { ThemeProvider } from "@mui/material/styles";
import customTheme from "@/styles/theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { Box, CssBaseline } from "@mui/material";
import SideBar from "@/components/layout/sidebar";
import { Metadata } from "next";
import { auth } from "@/auth";
import { LinkDetails } from "@/components/layout/sidebaritem";
import FaceIcon from "@mui/icons-material/Face";
import SettingsIcon from '@mui/icons-material/Settings';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baulog",
  description: "Decisions matter",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={customTheme}>
            <CssBaseline>{newFunction(children)}</CssBaseline>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

async function newFunction(children: React.ReactNode) {
  const session = await auth();

  const links: LinkDetails[] = [
    { text: "Home", icon: <FaceIcon />, path: "/"},
    { text: "Admin", icon: <SettingsIcon />, path: "/admin" },
  ];

  if (session) {
    return (
      <Box sx={{ display: "flex" }}>
        <TopBar />
        <SideBar links={links} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: "64px" }}>
          {children}
        </Box>
      </Box>
    );
  } else {
    return (
      <Box sx={{ display: "flex" }}>
        <Box component="main" sx={{ flexGrow: 1}}>
          {children}
        </Box>
      </Box>
    );
  }
}
