import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import CallerListItem from "./callers-list-item";
import { Caller } from "@/lib/models/caller.model";
import { Typography } from "@mui/material";

interface CallersListProps {
  items: readonly number[];
  callers: Caller[];
  checked: readonly number[];
  handleToggle: (value: number) => () => void;
}

export default function CallersList({ items, callers, checked, handleToggle }: CallersListProps) {
  return (
    <Paper sx={{ width: "100%", height: 200, overflow: 'auto' }}>
      <List dense component="div" role="list">
        {items && items.map((value: number) => {
          const caller = callers.find((caller) => caller.id === value);
          return (
            <CallerListItem
              key={value}
              value={value}
              caller={caller}
              checked={checked.indexOf(value) !== -1}
              handleToggle={handleToggle}
            />
          );
        })}
        {items.length === 0 && 
        <Typography variant="overline" sx={{paddingLeft:2}}>select callers</Typography>}
      </List>
    </Paper>
  );
}
