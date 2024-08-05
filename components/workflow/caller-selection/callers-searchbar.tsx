import { TextField } from "@mui/material";

interface CallersSearchBarProps {
  filter: string;
  setFilter: (filter: string) => void;
}

export default function CallersSearchBar({ filter, setFilter }: CallersSearchBarProps) {
  return (
    <TextField
    fullWidth
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      label="🔍"
      variant="filled"
      size="small"
    />
  );
}
