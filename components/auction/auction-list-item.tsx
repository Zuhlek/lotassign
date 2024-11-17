"use client"
import { Auction } from "@/lib/models/auction.model";
import { Box, Button, Card, CardContent, Divider, Typography } from "@mui/material";
import Link from "next/link";

interface AuctionListItemProps {
  auction: Auction;
  handleOpenDialog: () => void;
  handleDelete: (auctionId: number | undefined) => void;
  handleSelection: (auction: Auction) => void;
}

export default function AuctionListItem({ auction, handleOpenDialog, handleDelete, handleSelection }: AuctionListItemProps) {
  const link = `/auction/${auction.id}`;

  const handleEditClick = (auction: Auction) => {
    handleSelection(auction)
    handleOpenDialog()
  }

  return (
    <Card key={auction.id} sx={{ minWidth: 200, margin: 1, padding: 1}}>
      <CardContent>
        <Typography variant="h5" align="center">{auction.name}</Typography>
        <Typography variant="body1" align="center">{auction.toDDMMYYYY()}</Typography>
      </CardContent>
      <Divider sx={{marginTop: 2, marginBottom: 2}}></Divider>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Button size="small" onClick={() => handleEditClick(auction)}>Edit</Button>
        <Link href={link} passHref>
          <Button disableElevation size="small">Open</Button>
        </Link>
        <Button size="small" onClick={() => handleDelete(auction.id)}>Delete</Button>
      </Box>
    </Card>
  );
}
