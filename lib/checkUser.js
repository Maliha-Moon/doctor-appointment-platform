import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  // get the current logged-in user
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // API call to db
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
      // Details of transaction for the current month
      include: {
        transactions: {
          where: {
            type: "CREDIT_PURCHASE",
            // Only get transactions from current month
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }
    // if user doesn't exist, create
    const name = `${user.firstName} ${user.lastName}`;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        transactions: {
          create: {
            type: "CREDIT_PURCHASE",
            packageId: "free_user",
            amount: 2,
          },
        },
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
};
