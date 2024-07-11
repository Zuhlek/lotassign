import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import TopBarTitle from "./top-bar-title";
import { Box } from "@mui/material";
import TopBarProfileIcon from "./top-bar-profile-icon";

function TopBar() {
  return (
    <AppBar position="fixed" color="primary" elevation={0} sx={{ zIndex: 1201 }}>
      {/* 
      zIndex of drawer = 1200, https://mui.com/material-ui/customization/z-index/
      better find another solution which does not require use client for this component as well
      */}
      <Toolbar>
        <Box sx={{flexGrow: 1}}>
          <TopBarTitle />
        </Box>
        <TopBarProfileIcon />
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
