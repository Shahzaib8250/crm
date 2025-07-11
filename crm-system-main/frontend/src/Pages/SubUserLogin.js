import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, TextField, Typography, Paper } from '@mui/material';
import { login } from '../services/authService';

const SubUserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        // Fetch latest user profile from backend
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${result.data.user?.id || result.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          localStorage.setItem('user', JSON.stringify(user));
        }
        // Only allow user login from this form
        const { role } = result.data;
        if (role === 'user') {
          navigate('/user');
        } else {
          setError('You are not authorized to log in here. Please use the correct login page for your role.');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            User Login
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Typography align="center">
              <Button color="secondary" onClick={() => navigate('/login')}>
                Go to Admin/User Login
              </Button>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SubUserLogin; 