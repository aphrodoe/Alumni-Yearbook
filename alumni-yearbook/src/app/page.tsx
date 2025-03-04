'use client';

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "../components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      redirect("/dashboard")
    )
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button onClick={() => signIn("google")}>Sign In with Google</Button>
    </main>
  );
}