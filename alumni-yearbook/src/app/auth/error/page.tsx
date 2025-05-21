"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  let errorMessage = "An unknown error occurred during sign in.";
  
  if (error === "AccessDenied") {
    errorMessage = "Access denied. This email is not authorized to use the yearbook. Only alumni are allowed access.";
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
      <p className="text-gray-700 mb-6">{errorMessage}</p>
      <Button asChild className="w-full">
        <Link href="/">
          Return to Login
        </Link>
      </Button>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-600 p-6">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading...</h1>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}