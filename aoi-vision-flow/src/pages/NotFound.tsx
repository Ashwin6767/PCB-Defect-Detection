import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Box, Typography, Button, Container } from '@mui/material';
import { Home } from '@mui/icons-material';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h1" sx={{ mb: 2, fontWeight: 700, fontSize: '4rem' }}>
            404
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Oops! Page not found
          </Typography>
          <Button
            variant="contained"
            startIcon={<Home />}
            href="/"
            size="large"
          >
            Return to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
