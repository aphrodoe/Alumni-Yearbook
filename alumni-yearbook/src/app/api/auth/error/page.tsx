'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "An error occurred during authentication.";
  
  if (error === "AccessDenied") {
    errorMessage = "Access denied. Your email is not authorized to access this application.";
  }

  return (
    <div className="max-w-md text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="mb-6">{errorMessage}</p>
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
