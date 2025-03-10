import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        apple?: {
            main: string;
            dark: string;
            light: string;
            contrastText: string;
        };
    }
    interface PaletteOptions {
        apple?: {
            main: string;
            dark: string;
            light: string;
            contrastText: string;
        };
    }
}

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
            contrastText: '#ffffff',
        },
        error: {
            main: '#FF3B30', // Apple red
        },
        warning: {
            main: '#FF9500', // Apple orange
        },
        apple: {
            main: '#007AFF',
            dark: '#005BB5',
            light: '#66B2FF',
            contrastText: '#ffffff',
        },
        background: {
            default: '#F2F2F7',
            paper: '#FFFFFF',
        },
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        h1: {
            fontSize: '34px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
        },
        h2: {
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
        },
        h3: {
            fontSize: '22px',
            fontWeight: 600,
        },
        body1: {
            fontSize: '17px',
        },
        body2: {
            fontSize: '15px',
        },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '17px',
                    fontWeight: 600,
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                },
            },
        },
    },
}); 