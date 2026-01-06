// src/pages/Home.jsx
import React from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

function Home() {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to the Borrowing System!
      </Typography>
      <Typography variant="body1">
        This is the homepage. More content and features will be added here.
      </Typography>
    </Container>
  );
}

export default Home;
