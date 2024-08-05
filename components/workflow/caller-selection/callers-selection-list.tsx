"use client";
import Grid from "@mui/material/Grid";
import { Caller } from "@/lib/models/caller.model";
import { CallerService } from "@/lib/services/caller.service";
import { AuctionService } from "@/lib/services/auction.service";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CallersSearchBarProps from "./callers-searchbar";
import CallerList from "./callers-list";
import ButtonSection from "./button-section";

function not(a: readonly number[], b: readonly number[]) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a: readonly number[], b: readonly number[]) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

export default function CallersSelectionList() {
  const [checked, setChecked] = useState<readonly number[]>([]);
  const [callers, setCallers] = useState<Caller[]>([]);
  const [left, setLeft] = useState<readonly number[]>([]);
  const [right, setRight] = useState<readonly number[]>([]);
  const [leftFilter, setLeftFilter] = useState<string>("");
  const [rightFilter, setRightFilter] = useState<string>("");
  const auctionId = Number(useParams().auctionId);

  useEffect(() => {
    async function fetchData() {
      const allCallers = await CallerService.getAllCallers();
      setCallers(allCallers);

      const auction = await AuctionService.getAuctionById(Number(auctionId));
      if (auction) {
        setRight(auction.callerIds || []);
        setLeft(not(allCallers.map((caller) => caller.id!), auction.callerIds || []));
      }
    }

    fetchData();
  }, [auctionId]);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const handleAllRight = () => {
    setRight(right.concat(left));
    setLeft([]);
    updateAuctionCallers(right.concat(left));
  };

  const handleCheckedRight = () => {
    setRight(right.concat(leftChecked));
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));
    updateAuctionCallers(right.concat(leftChecked));
  };

  const handleCheckedLeft = () => {
    setLeft(left.concat(rightChecked));
    setRight(not(right, rightChecked));
    setChecked(not(checked, rightChecked));
    updateAuctionCallers(not(right, rightChecked));
  };

  const handleAllLeft = () => {
    setLeft(left.concat(right));
    setRight([]);
    updateAuctionCallers([]);
  };

  const updateAuctionCallers = async (callerIds: number[]) => {
    const auction = await AuctionService.getAuctionById(auctionId);
    if (auction) {
      await AuctionService.updateAuction(auctionId, { ...auction, callerIds });
    }
  };

  const filteredLeft = left.filter((id) =>
    callers.find((caller) => caller.id === id)?.name.toLowerCase().includes(leftFilter.toLowerCase())
  );

  const filteredRight = right.filter((id) =>
    callers.find((caller) => caller.id === id)?.name.toLowerCase().includes(rightFilter.toLowerCase())
  );

  return (
    <Grid container justifyContent="center" alignItems="top" sx={{ width: "100%" }}>
      <Grid item xs={5}>
        <CallersSearchBarProps filter={leftFilter} setFilter={setLeftFilter} />
        <CallerList items={filteredLeft} callers={callers} checked={checked} handleToggle={handleToggle} />
      </Grid>
      <Grid item xs={2}>
        <ButtonSection
          handleAllRight={handleAllRight}
          handleCheckedRight={handleCheckedRight}
          handleCheckedLeft={handleCheckedLeft}
          handleAllLeft={handleAllLeft}
          leftChecked={leftChecked}
          rightChecked={rightChecked}
          left={left}
          right={right}
        />
      </Grid>
      <Grid item xs={5}>
        <CallersSearchBarProps filter={rightFilter} setFilter={setRightFilter} />
        <CallerList items={filteredRight} callers={callers} checked={checked} handleToggle={handleToggle} />
      </Grid>
    </Grid>
  );
}
