"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Collapse,
  IconButton,
} from "@mui/material";
import { Settings, ExpandMore, ExpandLess } from "@mui/icons-material";
import { AuctionConfig } from "@/lib/models/auction-config.model";
import {
  getOrCreateAuctionConfig,
  updateAuctionConfig,
} from "@/lib/actions/auction-config.actions";

interface AuctionConfigProps {
  auctionId: number;
  onConfigChange?: (config: AuctionConfig) => void;
}

export default function AuctionConfigPanel({
  auctionId,
  onConfigChange,
}: AuctionConfigProps) {
  const [config, setConfig] = useState<AuctionConfig | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const loaded = await getOrCreateAuctionConfig(auctionId);
      setConfig(loaded);
    };
    loadConfig();
  }, [auctionId]);

  const handleChange = <K extends keyof AuctionConfig>(
    field: K,
    value: AuctionConfig[K]
  ) => {
    if (!config) return;
    const updated = new AuctionConfig(
      config.auctionId,
      field === "lotGap" ? (value as number) : config.lotGap,
      field === "prioritizePreferences" ? (value as boolean) : config.prioritizePreferences,
      field === "allowLanguageFallback" ? (value as boolean) : config.allowLanguageFallback,
      field === "balanceWorkload" ? (value as boolean) : config.balanceWorkload,
      config.id,
      config.createdAt,
      new Date()
    );
    setConfig(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config) return;
    await updateAuctionConfig(config);
    setHasChanges(false);
    onConfigChange?.(config);
  };

  if (!config) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1.5,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Settings sx={{ mr: 1, color: "text.secondary" }} />
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Assignment Settings
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Lot Gap: {config.lotGap}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Minimum number of lots between different bidders for the same caller
            </Typography>
            <Slider
              value={config.lotGap}
              onChange={(_, value) => handleChange("lotGap", value as number)}
              min={1}
              max={20}
              step={1}
              marks={[
                { value: 1, label: "1" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 20, label: "20" },
              ]}
              sx={{ mt: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={config.prioritizePreferences}
                onChange={(e) =>
                  handleChange("prioritizePreferences", e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography variant="body2">Prioritize Preferences</Typography>
                <Typography variant="caption" color="text.secondary">
                  Honor caller-bidder preferences when possible
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: "flex-start" }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.allowLanguageFallback}
                onChange={(e) =>
                  handleChange("allowLanguageFallback", e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography variant="body2">Allow Language Fallback</Typography>
                <Typography variant="caption" color="text.secondary">
                  Assign callers even if language doesn&apos;t match perfectly
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: "flex-start" }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.balanceWorkload}
                onChange={(e) =>
                  handleChange("balanceWorkload", e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography variant="body2">Balance Workload</Typography>
                <Typography variant="caption" color="text.secondary">
                  Distribute assignments evenly across callers
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start" }}
          />

          {hasChanges && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" size="small" onClick={handleSave}>
                Save Settings
              </Button>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
