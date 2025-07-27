import { PrismaClient } from "./generated/prisma";

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    omit: {
      user: { password: true },
    },
  });

declare global {
  var prisma: PrismaClient<{ omit: { user: { password: true } } }> | undefined;
}
//@ts-ignore
if (process.env.NODE_ENV === "development") globalThis.prisma = prisma;
