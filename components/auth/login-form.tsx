"use client"
import { login } from "@/lib/authActions";
import { Typography, TextField, Button, Box, Grid } from "@mui/material";
import { useState } from "react";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async () => {
    try {
      await login({ email, password });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
      throw error;
    }
  };

  return (
    <Box>
      <Typography component="h1" variant="h5">
        Login
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box component="form" action={onSubmit} style={{ width: "100%" }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
          Sign In
        </Button>
      </Box>
      <Grid container>
        <Grid item xs>
 
        </Grid>
        <Grid item>

        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginForm;
