import { Box, Button, TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import PlusOneIcon from '@mui/icons-material/PlusOne';

interface AuctionListToolbarProps {
    searchText: string;
    setSearchText: Dispatch<SetStateAction<string>>;
    handleOpen: (isCreateMode: boolean) => void;
}

export default function AuctionListToolbar({searchText, setSearchText, handleOpen}: AuctionListToolbarProps) {
    return (
        <Box display="flex" justifyContent="center" pb={2}>
          <TextField size="small" type="text" label="🔍" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <Button onClick={() => handleOpen(true)}>
            <PlusOneIcon />
          </Button>
        </Box>
      );
}