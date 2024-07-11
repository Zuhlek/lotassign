"use client";
import Link from "next/link";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

export interface LinkDetails {
  text: string;
  icon: JSX.Element;
  path: string;
}

// Leave Link component from Next.js here, as it will enable client-side routing
// https://nextjs.org/docs/pages/api-reference/components/link#with-url-object
// also, make sure to pass passHref and legacyBehavior props to Link component to disable default formatting blue & underline
// https://stackoverflow.com/questions/76036888/my-mui-listitem-is-blue-colored-when-using-next-link-how-can-i-fix-this

function SideBarItem({ link, key }: { link: LinkDetails, key: string}) {
  return (
    
    <Link href={link.path} passHref legacyBehavior>
      <ListItem key={key} disablePadding>
        <ListItemButton>
          <ListItemIcon>{link.icon}</ListItemIcon>
          <ListItemText primary={link.text}></ListItemText>
        </ListItemButton>
      </ListItem>
    </Link>
  );
}

export default SideBarItem;
