import { Inter } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import customTheme from "@/styles/theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { Box, CssBaseline } from "@mui/material";
import { Metadata } from "next";
import TopBar from "@/components/layout/topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lotassign",
  description: "Call me maybe?",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={customTheme}>
            <CssBaseline>
              {" "}
              <Box sx={{ display: "flex" }}>
                <TopBar />
                <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: "64px" }}>
                  {children}
                </Box>
              </Box>
            </CssBaseline>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
