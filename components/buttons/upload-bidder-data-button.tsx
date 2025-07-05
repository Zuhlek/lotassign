"use client";

import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { Language } from "@/lib/models/language.enum";
import { Bidder } from "@/lib/models/bidder.model";
import { Lot } from "@/lib/models/lot.model";
import { LotBidder, LotBidderStatus } from "@/lib/models/lot-bidder.model";

import { createBidder, getBidderById } from "@/lib/actions/bidder.actions";
import { getLotByAuctionIdAndNumber, createLot } from "@/lib/actions/lot.actions";
import { createLotBidder } from "@/lib/actions/lot-bidder.actions";

interface UploadBidderDataButtonProps {
  auctionId: number;
}

export default function UploadBidderDataButton({ auctionId }: UploadBidderDataButtonProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const workbook = new ExcelJS.Workbook();
        const data = await files[0].arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];

        const rows: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const values = row.values as any;
            rows.push({
              LotNumber: values[1],
              LotName: values[2],
              BidderName: values[3],
              BidderPhoneNumber: values[4],
              BidderLanguages: (values[5] as string).split(",").map((lang) => lang.trim()),
            });
          }
        });

        const bidderMap = new Map<string, Bidder>();
        const lotMap = new Map<string, Lot>();

        for (const row of rows) {
          let bidder = bidderMap.get(row.BidderName);
          if (!bidder) {
            const langs: Language[] = row.BidderLanguages.map((lang: string) =>
              Object.values(Language).includes(lang as Language) ? lang : Language.Englisch
            );

            const newBidder = new Bidder(row.BidderName, row.BidderPhoneNumber, langs);
            const bidderId = await createBidder(newBidder);
            bidder = await getBidderById(bidderId);
            if (!bidder) continue;
            bidderMap.set(row.BidderName, bidder);
          }

          const lotKey = `${auctionId}-${row.LotNumber}`;
          let lot = lotMap.get(lotKey);
          if (!lot) {
            lot = await getLotByAuctionIdAndNumber(auctionId, parseInt(row.LotNumber));
            if (!lot) {
              const newLot = new Lot(auctionId, parseInt(row.LotNumber), row.LotName);
              const lotId = await createLot(newLot);
              lot = new Lot(auctionId, newLot.number, newLot.title, lotId);
            }
            lotMap.set(lotKey, lot);
          }

          const lotBidder = new LotBidder(auctionId, lot.id!, bidder.id!, "planned" as LotBidderStatus);
          await createLotBidder(lotBidder);
        }

        alert("Bidder and Lot data imported successfully.");
      } catch (error) {
        console.error("Error importing bidder and lot data:", error);
        alert("An error occurred while importing data. Please check the console for details.");
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="upload-button-file"
      />
      <label htmlFor="upload-button-file">
        <Button variant="contained" component="span" sx={{ margin: 1 }}>
          Import Bidder & Lot Data
        </Button>
      </label>
    </div>
  );
}
