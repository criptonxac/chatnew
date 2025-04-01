import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';

// Pages
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import Chat from './pages/Chat.js';

// Context
import { AuthProvider, useAuth } from './context/AuthContext.js';

// Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5288c1',
    },
    secondary: {
      main: '#6c7883',
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// Main App wrapper that provides theme and auth context
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Routes component that uses auth context
function AppRoutes() {
  const { isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Add a small delay to prevent flickering during auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [token]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
