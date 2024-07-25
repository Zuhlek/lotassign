const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const callersData = require("./callers.json");
const lotData = require("./lots.json");
const bidderData = require("./bidders.json");

async function createAssignments(lotId: string, lotNumber: number) {
  let assignments = [];
  for (const bidder of bidderData) {
    if (parseInt(bidder.lotNumber, 10) === lotNumber) {
      const bidderFound = await prisma.bidder.findFirst({
        where: { name: bidder.name },
      });

      if (bidderFound) {
        const existingAssignment = await prisma.assignment.findFirst({
          where: {
            lotId: lotId,
            bidderId: bidderFound.id,
          },
        });

        if (!existingAssignment) {
          const assignment = await prisma.assignment.create({
            data: {
              lotId: lotId,
              bidderId: bidderFound.id,
              callerId: null,
              isFinal: false,
            },
          });
          assignments.push(assignment);
        }
      }
    }
  }
  return assignments;
}

async function main() {
  // Create bidders
  const createdBidders = new Set();
  for (const b of bidderData) {
    if (!createdBidders.has(b.name)) {
      await prisma.bidder.create({
        data: {
          name: b.name,
          languages: ["D", "E"],
          phoneNumber: `+41790815`,
        },
      });
      createdBidders.add(b.name);
    }
  }

  // Create callers from JSON data
  const callers = [];
  for (const callerData of callersData) {
    const caller = await prisma.caller.create({
      data: {
        name: callerData.Name,
        abbreviation: callerData.Kürzel,
        languages: callerData.Sprache.map((lang: string) => lang ),
      },
    });
    callers.push(caller);
  }

  // Create an auction
  const auctionCallers = callers.slice(0, 9)
  const auction = await prisma.auction.create({
    data: {
      name: "Test Auction",
      date: new Date(),
      callers: {
        connect: auctionCallers.map((caller) => ({ id: caller.id })),
      },
    },
  });

  for (const lot of lotData) {

    const createdLot = await prisma.lot.create({
      data: {
        number: parseInt(lot.number, 10),
        description: lot.description,
        date: new Date(),
        auction: {
          connect: { id: auction.id },
        }
      },
    });

    await createAssignments(createdLot.id, createdLot.number);
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
