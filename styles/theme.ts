'use client';

import { createTheme } from '@mui/material/styles';


const customTheme = createTheme({
  palette: {
    primary: {
      main: '#3064f1',
      light: '#e0e8ff',
      dark: '#020201',
      contrastText: '#ffffff',
    },
  },
});

export default customTheme;