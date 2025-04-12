"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Slider } from "~/components/ui/slider";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { BetHistory } from "~/components/game/bet-history";

export function GameBoard() {
  const router = useRouter();

  const [threshold, setThreshold] = useState(5000);
  const [betAmount, setBetAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const balanceQuery = api.game.getUserBalance.useQuery();
  const balance = balanceQuery.data?.balance ?? 0;

  const betMutation = api.game.placeBet.useMutation({
    onSuccess: async (data) => {
      setIsLoading(false);

      const resultMessage = data?.bet?.won
        ? `You won ${Number(data?.bet?.payout).toFixed(2)}!`
        : "You lost your bet.";

      if (data?.bet?.won) {
        toast.success(`Number was ${data?.game?.number}`, {
          description: resultMessage,
        });
      } else {
        toast.error(`Number was ${data?.game?.number}`, {
          description: resultMessage,
        });
      }

      await balanceQuery.refetch();
      router.refresh();
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // Calculate payout multiplier based on threshold
  const midpoint = 4999.5;
  const distance = Math.abs(threshold - midpoint);
  const maxDistance = midpoint;
  const normalizedDistance = distance / maxDistance;
  const payoutMultiplier = 2 + normalizedDistance * 8;

  // Calculate win probability
  const winProbability =
    threshold > midpoint
      ? ((9999 - threshold) / 10000) * 100
      : (threshold / 10000) * 100;

  const handleBet = (isAbove: boolean) => {
    setIsLoading(true);
    betMutation.mutate({
      amount: betAmount,
      threshold,
      isAbove,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Number Guessing Game</CardTitle>
            <CardDescription>
              Guess if the number (0-9999) is above or below the threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Threshold: {threshold}
                </span>
                <span className="text-sm font-medium">
                  Balance: ${balance.toFixed(2)}
                </span>
              </div>

              <Slider
                value={[threshold]}
                min={0}
                max={9999}
                step={1}
                onValueChange={(value) => setThreshold(value[0]!)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="betAmount">Bet Amount</Label>
                  <Input
                    id="betAmount"
                    type="number"
                    min={1}
                    max={balance}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Potential Payout</Label>
                  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    ${(betAmount * payoutMultiplier).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payout Multiplier</Label>
                  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    {payoutMultiplier.toFixed(2)}x
                  </div>
                </div>
                <div>
                  <Label>Win Probability</Label>
                  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    {winProbability.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleBet(false)}
              disabled={isLoading || betAmount <= 0 || betAmount > balance}
            >
              Below {threshold}
            </Button>
            <Button
              className="w-full"
              onClick={() => handleBet(true)}
              disabled={isLoading || betAmount <= 0 || betAmount > balance}
            >
              Above {threshold}
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Bet History</CardTitle>
          </CardHeader>
          <CardContent>
            <BetHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
