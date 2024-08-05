import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import { Caller } from "@/lib/models/caller.model";

interface CallersListItemProps {
  value: number;
  caller?: Caller;
  checked: boolean;
  handleToggle: (value: number) => () => void;
}

export default function CallersListItem({
  value,
  caller,
  checked,
  handleToggle,
}: CallersListItemProps) {
  const labelId = `transfer-list-item-${value}-label`;

  return (
    <ListItemButton
      role="listitem"
      onClick={handleToggle(value)}
      sx={{ paddingBottom: 0, paddingTop: 0, marginTop: 0, marginBottom: 0 }}
    >
      <ListItemIcon sx={{ paddingBottom: 0, paddingTop: 0, marginTop: 0, marginBottom: 0 }}>
        <Checkbox
          size="small"
          checked={checked}
          tabIndex={-1}
          disableRipple
          inputProps={{ "aria-labelledby": labelId }}
          sx={{ paddingBottom: 0, paddingTop: 0, marginTop: 0, marginBottom: 0 }}
        />
      </ListItemIcon>
      <ListItemText
        id={labelId}
        primary={caller ? caller.name : `Caller ${value}`}
        sx={{ paddingBottom: 0, paddingTop: 0, marginTop: 0, marginBottom: 0 }}
      />
    </ListItemButton>
  );
}
