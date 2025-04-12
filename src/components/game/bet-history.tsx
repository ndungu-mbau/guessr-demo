"use client";

import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";

export function BetHistory() {
  const { data: betHistory, isLoading } = api.game.getBetHistory.useQuery();

  if (isLoading) {
    return <div>Loading bet history...</div>;
  }

  if (!betHistory || betHistory.length === 0) {
    return <div>No bet history found. Place your first bet!</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {betHistory.map((bet) => (
            <TableRow key={bet.id}>
              <TableCell>{bet.game.number}</TableCell>
              <TableCell>{bet.threshold}</TableCell>
              <TableCell>{bet.isAbove ? "Above" : "Below"}</TableCell>
              <TableCell>${Number(bet.amount).toFixed(2)}</TableCell>
              <TableCell>${Number(bet.payout).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={bet.won ? "success" : "destructive"}>
                  {bet.won ? "Won" : "Lost"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
