const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr: any[]) {
  return arr[getRandomInt(0, arr.length - 1)];
}

function createRandomName() {
  const firstNames = ["John", "Jane", "Max", "Anna", "Leo", "Ella", "Liam", "Mia", "Noah", "Emma"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];

  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

async function main() {
  // Create 20 bidders
  const bidders: any[] = [];
  for (let i = 0; i < 20; i++) {
    let name: string;
    do {
      name = createRandomName();
    } while (bidders.some((b) => b.name === name));

    const bidder = await prisma.bidder.create({
      data: {
        name,
        languages: ["DE", "EN"],
        phoneNumber: `+41791${i}2${i}`,
      },
    });

    bidders.push(bidder);
  }

  // Create 5 callers
  const callerNames = ["Jara", "Laura", "Isabelle", "Cyril", "Maxim"];
  const callers = [];
  let desiredBidderId = 0;
  for (const callerName of callerNames) {
    const caller = await prisma.caller.create({
      data: {
        name: callerName,
        abbreviation: `${callerName.charAt(0)}K`,
        languages: ["DE", "EN", "FR"],
        desiredBidders: { connect: { id: bidders[desiredBidderId].id } },
      },
    });
    callers.push(caller);
    desiredBidderId += 2;
  }

  // Create an auction
  const auction = await prisma.auction.create({
    data: {
      name: "Test Auction",
      date: new Date(),
    },
  });

  // Create 50 lots and assign 1-4 random bidders to each lot
  for (let i = 0; i < 50; i++) {
    const numAssignments = getRandomInt(0, 4);
    const assignedBidders = new Set<string>();
    const assignments = [];

    while (assignedBidders.size < numAssignments) {
      const bidder = getRandomElement(bidders);
      if (!assignedBidders.has(bidder.id)) {
        assignedBidders.add(bidder.id);
        assignments.push({
          bidderId: bidder.id,
          isFinal: false,
        });
      }
    }

    await prisma.lot.create({
      data: {
        number: i + 1,
        auctionId: auction.id,
        date: new Date(),
        assignments: {
          create: assignments,
        },
      },
    });
  }

  console.log("Auction, lots, callers, and bidders created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
