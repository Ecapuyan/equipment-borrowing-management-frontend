// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f766e', // Teal 700 - Professional, trustworthy, distinct from default blue
      light: '#2dd4bf', // Teal 400
      dark: '#115e59', // Teal 800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // Indigo 500 - Good accent color for actions
      light: '#818cf8',
      dark: '#4338ca',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f3f4f6', // Gray 100 - Softer than pure white for dashboards
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937', // Gray 800
      secondary: '#6b7280', // Gray 500
    },
    status: {
      pending: '#f59e0b', // Amber 500
      approved: '#10b981', // Emerald 500
      rejected: '#ef4444', // Red 500
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#111827', // Gray 900
    },
    h5: {
      fontWeight: 600,
      color: '#374151',
    },
    h6: {
      fontWeight: 600,
      color: '#4b5563',
    },
    button: {
      textTransform: 'none', // Modern feel (no all-caps)
      fontWeight: 600,
      borderRadius: 8,
    },
  },
  shape: {
    borderRadius: 12, // Softer, modern corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          padding: '10px 24px',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #0f766e 30%, #115e59 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)', // Tailwind-like shadow
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            elevation1: {
                boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
            },
            elevation3: {
                boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }
        }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                }
            }
        }
    }
  },
});

export default theme;