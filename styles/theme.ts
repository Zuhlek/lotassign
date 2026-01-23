'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#374151',      // Gray-700
      light: '#6B7280',     // Gray-500
      dark: '#1F2937',      // Gray-800
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFB',   // Gray-50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',   // Gray-900
      secondary: '#6B7280', // Gray-500
      disabled: '#9CA3AF',  // Gray-400
    },
    divider: '#E5E7EB',     // Gray-200
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#065F46',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#92400E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#991B1B',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    button: {
      textTransform: 'none' as const,
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#374151',
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
          padding: '10px 14px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
