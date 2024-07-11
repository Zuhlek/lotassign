import { useTheme } from "@mui/material/styles"; // Import the Theme type from @mui/material/styles
import { Box, Typography, Button } from "@mui/material";
import { GridToolbarContainer, GridToolbarQuickFilter, GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarExport } from "@mui/x-data-grid";
import { title } from "process";
import AddCircleIcon from "@mui/icons-material/AddCircle";

interface Props {
  handleCreate: () => void;
}

const CustomToolbar = ({handleCreate}: Props) => {

  const theme = useTheme(); 

  return (
    <GridToolbarContainer>
      <Box display="flex" alignContent="center" justifyContent="space-between" bgcolor={theme.palette.primary.light} sx={{ width: "100%" }}>
        <Box display="flex">
          <Typography sx={{ pl: 1, pr: 4, fontSize: 24 }} color="primary">
            {title}
          </Typography>
        </Box>
        <Box display="flex" >
          <GridToolbarQuickFilter color="primary" />
        </Box>

        <Box display="flex" alignItems="center" style={{ justifyContent: "flex-end" }}>
          <GridToolbarColumnsButton />
          <GridToolbarDensitySelector />
          <GridToolbarExport />
          <Button onClick={handleCreate}>
            <AddCircleIcon />
          </Button>
        </Box>
      </Box>
    </GridToolbarContainer>
  );
};

export default CustomToolbar;