'use client';

import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#64748B',      // Slate gray - lighter, more approachable
      light: '#94A3B8',     // Light slate
      dark: '#475569',      // Darker slate for hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#94A3B8',
      light: '#CBD5E1',
      dark: '#64748B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',   // Pure white background
      paper: '#FFFFFF',     // White cards
    },
    text: {
      primary: '#1E293B',   // Dark slate - high contrast on white
      secondary: '#64748B', // Medium gray for secondary text
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
    success: {
      main: '#22C55E',
      light: '#DCFCE7',
      dark: '#166534',
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
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    action: {
      active: '#475569',
      hover: 'rgba(100, 116, 139, 0.08)',
      selected: 'rgba(100, 116, 139, 0.12)',
      disabled: 'rgba(100, 116, 139, 0.38)',
      disabledBackground: 'rgba(100, 116, 139, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none' as const,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FFFFFF',
          scrollbarColor: '#CBD5E1 #F1F5F9',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#CBD5E1',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#475569',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none' as const,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: '#475569',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#334155',
          },
        },
        outlinedPrimary: {
          borderColor: '#CBD5E1',
          color: '#475569',
          '&:hover': {
            borderColor: '#94A3B8',
            backgroundColor: 'rgba(100, 116, 139, 0.04)',
          },
        },
        text: {
          color: '#475569',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#475569',
          '&:hover': {
            backgroundColor: 'rgba(100, 116, 139, 0.08)',
          },
        },
        sizeSmall: {
          padding: 6,
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
        colorPrimary: {
          color: '#475569',
        },
        colorSecondary: {
          color: '#64748B',
        },
        colorAction: {
          color: '#475569',
        },
        colorDisabled: {
          color: '#94A3B8',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#334155',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F8FAFC',
          },
          '&.Mui-selected': {
            backgroundColor: '#F1F5F9',
            '&:hover': {
              backgroundColor: '#E2E8F0',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: '#334155',
          borderColor: '#E2E8F0',
          padding: '12px 16px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#1E293B',
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 24px 16px',
          color: '#334155',
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          color: '#475569',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: '#475569',
          color: '#FFFFFF',
        },
        colorDefault: {
          backgroundColor: '#F1F5F9',
          color: '#475569',
          border: '1px solid #E2E8F0',
        },
        outlined: {
          borderColor: '#CBD5E1',
          color: '#475569',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#DCFCE7',
          color: '#166534',
          '& .MuiAlert-icon': {
            color: '#22C55E',
          },
        },
        standardWarning: {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          '& .MuiAlert-icon': {
            color: '#F59E0B',
          },
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          '& .MuiAlert-icon': {
            color: '#EF4444',
          },
        },
        standardInfo: {
          backgroundColor: '#DBEAFE',
          color: '#1E40AF',
          '& .MuiAlert-icon': {
            color: '#3B82F6',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#CBD5E1',
            },
            '&:hover fieldset': {
              borderColor: '#94A3B8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#64748B',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#64748B',
          },
          '& .MuiInputBase-input': {
            color: '#1E293B',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94A3B8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#64748B',
          },
        },
        icon: {
          color: '#64748B',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#64748B',
          '&.Mui-focused': {
            color: '#475569',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#64748B',
        },
        thumb: {
          backgroundColor: '#475569',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0 0 0 8px rgba(100, 116, 139, 0.16)',
          },
        },
        track: {
          backgroundColor: '#64748B',
        },
        rail: {
          backgroundColor: '#CBD5E1',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
              color: '#475569',
              '& + .MuiSwitch-track': {
                backgroundColor: '#94A3B8',
              },
            },
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#CBD5E1',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#94A3B8',
          '&.Mui-checked': {
            color: '#475569',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#1E293B',
        },
        secondary: {
          color: '#64748B',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#1E293B',
        },
      },
    },
  },
});

export default customTheme;
