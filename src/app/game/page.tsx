import { GameBoard } from "~/components/game/game-board";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function GamePage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-center text-4xl font-bold">
          Number Guessing Game
        </h1>
        <GameBoard />
      </div>
    </main>
  );
}
