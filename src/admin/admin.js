import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function isAdmin (user_id)  {
  try {
    const admin = await prisma.users.findMany({
      where: {
        user_id: user_id,
      },
    });
    return admin[0].is_admin;
  } catch (e) {
    console.log("ERROR: ", e);
  }
};

