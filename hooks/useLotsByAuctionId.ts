import { db } from "@/lib/db/dexie.db";
import { Lot } from "@/lib/models/lot.model";
import { lotService } from "@/lib/actions/lot.actions";
import { useEffect, useState } from "react";


export function useLotsByAuctionId(auctionId: number) {
  const [lots, setLots] = useState<Lot[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchLots = async () => {
      setIsLoading(true);
      try {
        const auctionLots = await lotService.getAllLotsByAuctionId(auctionId);
        setLots(auctionLots);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch lots for auction:", err);
        setError("Failed to fetch lots");
        setIsLoading(false);
      }
    };

    if (auctionId) {
      fetchLots();
    }
  }, [auctionId]);

  return { lots, isLoading, error };
}