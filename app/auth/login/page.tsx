import React from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Box sx={{ position: "relative", height: "100vh", width: "100vw" }}>
      <Box
        component="img"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        alt="LandingPageImage"
        src="/LandingPageImage.png"
      />
      <Box
        sx={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translate(-50%, 0)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Card variant="outlined" sx={{ maxWidth: 400, width: "90%" }}>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
