import Link from "next/link";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Number <span className="text-[hsl(280,100%,70%)]">Guessing</span>{" "}
            Game
          </h1>
          <div className="flex flex-col items-center gap-2">
            {session ? (
              <Link href="/game">
                <Button size="lg">Play Now</Button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <Button size="lg">Sign In to Play</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
