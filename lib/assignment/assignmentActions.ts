"use server";
import { Assignment, Caller } from "@prisma/client";
import {
  AssignmentsWithCallersAndBidders,
  getLotsForAuction,
  getPriorityCallerForBidder,
  LotWithAssignmentsWithCallersAndBidders,
  updateAssignment,
} from "./assignmentFunctions";
import prisma from "../db";

export async function removeAllCallerIdsFromAssignments() {
  await prisma.assignment.updateMany({
    data: {
      callerId: null,
    },
  });
}

export async function assignCallersToDesiredBidders(auctionId: string) {
  const lots = await getLotsForAuction(auctionId);

  for (const lot of lots) {
    for (const assignment of lot.assignments) {
      const priorityCaller = await getPriorityCallerForBidder(assignment.bidderId);
      if (priorityCaller) {
        await updateAssignment(true, assignment.id, lot.id, priorityCaller.id, assignment.bidderId);
      }
    }
  }
}

export async function assignCallersToBidders(auctionId: string) {
  const lots = await getLotsForAuction(auctionId);
  let callersSet: Set<Caller> = new Set();
  for (const l of lots) {
    for (const a of l.assignments) {
      if (a.caller !== null) {
        callersSet.add(a.caller);
      }
    }
  }
  const callers: Caller[] = Array.from(callersSet);
  const processedAssignments: Assignment[] = [];
  let lastNLots: LotWithAssignmentsWithCallersAndBidders[] = [];

  for (const l of lots) {
    console.log(`------------- ${l.number} -------------`);
    const currentLotAssignments = l.assignments;

    for (let a of currentLotAssignments) {
      const b = await prisma.bidder.findUnique({ where: { id: a.bidderId } });
      console.log(`🧍 ${b?.name}`);

      if (!a) {
        continue;
      }
      if (isAssignmentFinal(a) || hasAssignmentAlreadyACaller(a)) {
        processedAssignments.push(a);
        continue;
      }

      const alreadyAssignedCaller = await getCallerWhoWasAlreadyAssignedToBidder(a.bidderId);

      if (alreadyAssignedCaller) {
        console.log(`${alreadyAssignedCaller.name}`);
        if (isTheCallerEligibleForTheAssignment(alreadyAssignedCaller.id, lastNLots)) {
          a = await assignCallerToBidder(a, alreadyAssignedCaller);
          processedAssignments.push(a);
          continue;
        } else {
          console.log(`🚫 (prev caller)`);
        }
      }

      for (const caller of callers) {
        console.log(`${caller.name}`);
        if (isTheCallerEligibleForTheAssignment(caller.id, lastNLots)) {
          a = await assignCallerToBidder(a, caller);
          processedAssignments.push(a);
          break;
        } else {
          console.log(`🚫`);
        }
      }

      processedAssignments.push(a);
      const updatedLot = await prisma.lot.findUnique({ where: { id: l.id }, include: { assignments: { include: { caller: true, bidder: true } } } });
      if (updatedLot) {
        lastNLots = addAndKeepLastNLot(lastNLots, updatedLot, 4);
      } else {
        lastNLots = addAndKeepLastNLot(lastNLots, l, 4);
      }
    }
  }
}

function addAndKeepLastNLot(
  currentLots: LotWithAssignmentsWithCallersAndBidders[],
  newLot: LotWithAssignmentsWithCallersAndBidders,
  n: number
): LotWithAssignmentsWithCallersAndBidders[] {
  currentLots.push(newLot);
  if (currentLots.length > n) {
    currentLots.shift();
  }
  return currentLots;
}

function isTheCallerEligibleForTheAssignment(callerId: string, lastNLots: LotWithAssignmentsWithCallersAndBidders[]): boolean {
  for (const lot of lastNLots) {
    if (wasTheCallerAlreadyAssignedToTheLot(lot.assignments, callerId)) {
      return false;
    }
  }
  return true;
}

async function getCallerWhoWasAlreadyAssignedToBidder(bidderId: string): Promise<Caller | null> {
  return await prisma.caller.findFirst({
    where: {
      assignments: {
        some: {
          bidderId: bidderId,
          isFinal: true,
        },
      },
    },
  });
}

function wasTheCallerAlreadyAssignedToTheLot(lotAssignments: Assignment[], callerId: string): boolean {
  return lotAssignments.some((a) => a.callerId === callerId);
}

function hasAssignmentAlreadyACaller(assignment: Assignment): boolean {
  return assignment.callerId !== null;
}

function isAssignmentFinal(assignment: Assignment): boolean {
  return assignment.isFinal;
}

async function assignCallerToBidder(relevantAssignment: Assignment, caller: Caller): Promise<AssignmentsWithCallersAndBidders> {
  console.log(`-->> 📞 ${caller.name}`);
  const updatedAssignment = await updateAssignment(false, relevantAssignment.id, relevantAssignment.lotId, caller.id, relevantAssignment.bidderId);
  return updatedAssignment;
}
