import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bets, games, users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

export const gameRouter = createTRPCRouter({
  placeBet: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        threshold: z.number().min(0).max(9999),
        isAbove: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { amount, threshold, isAbove } = input;
      const userId = ctx.session.user.id;

      // Get user balance
      const userResult = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!userResult) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const balance = Number(userResult.balance);

      if (balance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      // Calculate payout multiplier based on threshold
      // The further from the midpoint (4999.5), the higher the payout
      const midpoint = 4999.5;
      const distance = Math.abs(threshold - midpoint);
      const maxDistance = midpoint;
      const normalizedDistance = distance / maxDistance;

      // Base multiplier is 2x, max can be 10x
      const payoutMultiplier = 2 + normalizedDistance * 8;

      // Generate random number
      const randomNumber = Math.floor(Math.random() * 10000);

      // Determine if the bet won
      const won = isAbove ? randomNumber > threshold : randomNumber < threshold;

      // Calculate payout
      const payout = won ? amount * payoutMultiplier : 0;

      // Create game record
      const [gameResult] = await ctx.db
        .insert(games)
        .values({
          number: randomNumber,
        })
        .returning();

      // Create bet record
      const [betResult] = await ctx.db
        .insert(bets)
        .values({
          userId,
          gameId: gameResult?.id,
          amount,
          threshold,
          isAbove,
          payout: won ? amount * payoutMultiplier : 0,
          won,
        })
        .returning();

      // Update user balance
      await ctx.db
        .update(users)
        .set({
          balance: balance - amount + payout,
        })
        .where(eq(users.id, userId));

      return {
        game: gameResult,
        bet: betResult,
        newBalance: balance - amount + payout,
      };
    }),

  getBetHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const betHistory = await ctx.db.query.bets.findMany({
      where: eq(bets.userId, userId),
      orderBy: [desc(bets.createdAt)],
      limit: 10,
      with: {
        game: true,
      },
    });

    return betHistory;
  }),

  getUserBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userResult = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userResult) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      balance: Number(userResult.balance),
    };
  }),
});
