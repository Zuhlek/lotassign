"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import {
  Gavel,
  People,
  Storage,
  ArrowForward,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { checkDatabaseIntegrity } from "@/lib/utils/db-helpers";

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const workflowSteps: WorkflowStep[] = [
  {
    number: 1,
    title: "Manage Callers",
    description: "Add callers and their language skills. Import from Excel or add manually.",
    href: "/callers",
    icon: <People fontSize="large" />,
  },
  {
    number: 2,
    title: "Set Up Auction",
    description: "Create auctions, import lots and bidders, select callers for the event.",
    href: "/auction",
    icon: <Gavel fontSize="large" />,
  },
  {
    number: 3,
    title: "Run Assignment",
    description: "Auto-assign callers to bidders based on languages, preferences, and availability.",
    href: "/auction",
    icon: <CheckCircle fontSize="large" />,
  },
];

export default function HomePage() {
  const [dbStatus, setDbStatus] = useState<{
    status: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    checkDatabaseIntegrity().then(setDbStatus);
  }, []);

  const getStatusIcon = () => {
    if (!dbStatus) return null;
    switch (dbStatus.status) {
      case "success":
        return <CheckCircle color="success" />;
      case "warning":
        return <Warning color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusStyles = () => {
    if (!dbStatus) return {};
    const colorMap = {
      success: { bgcolor: 'success.light', borderColor: 'success.main' },
      warning: { bgcolor: 'warning.light', borderColor: 'warning.main' },
      error: { bgcolor: 'error.light', borderColor: 'error.main' },
    };
    return colorMap[dbStatus.status];
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          LotAssign
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Auction caller assignment made simple
        </Typography>
      </Box>

      {dbStatus && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
            border: 1,
            ...getStatusStyles(),
          }}
        >
          {getStatusIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2">{dbStatus.message}</Typography>
          </Box>
          {dbStatus.status === "error" && (
            <Link href="/backups">
              <Button size="small" variant="outlined">
                Import Data
              </Button>
            </Link>
          )}
        </Paper>
      )}

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Workflow
      </Typography>

      <Grid container spacing={3}>
        {workflowSteps.map((step, index) => (
          <Grid size={{ xs: 12, md: 4}} key={step.number}>
            <Link href={step.href} style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Chip
                      label={step.number}
                      size="small"
                      color="primary"
                      sx={{ mr: 1, fontWeight: 600 }}
                    />
                    <Box sx={{ color: "grey.600" }}>{step.icon}</Box>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
            {index < workflowSteps.length - 1 && (
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  position: "absolute",
                  right: -20,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <ArrowForward color="disabled" />
              </Box>
            )}
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Link href="/auction">
          <Button variant="contained" size="large" startIcon={<Gavel />}>
            Go to Auction
          </Button>
        </Link>
        <Link href="/backups">
          <Button variant="outlined" size="large" startIcon={<Storage />}>
            Manage Data
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
