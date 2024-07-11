import { IconButton } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from "@/auth";

const TopBarTitle = async () => {
  return (
    <div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirect: true, redirectTo: "/auth/login" });
        }}
      >
        <IconButton size="large" edge="start" aria-label="menu" type="submit">
          <LogoutIcon />
        </IconButton>
      </form>
    </div>
  );
};

export default TopBarTitle;

