import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import FaceIcon from "@mui/icons-material/Face";
import SideBarItem, { LinkDetails } from "./sidebaritem";
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 180;

interface Props {
  links: LinkDetails[];
}

const SideBar = ({ links }: Props) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto" }}>
        <List>
          {links.map((link) => (
            <SideBarItem link={link} key={`${link.text}-${link.path}`}/>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

export default SideBar;
