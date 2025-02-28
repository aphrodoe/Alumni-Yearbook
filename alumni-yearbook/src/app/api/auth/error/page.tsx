'use client';

import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="mb-6">Only users with emails starting with "b21" are allowed to sign in.</p>
      <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Return to Home
      </Link>
    </div>
  );
}