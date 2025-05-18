"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkPreferences = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/users/check-preferences?email=${session.user.email}`);
          const data = await response.json();
          
          if (data.hasCompletedPreferences) {
            router.push('/dashboard');
          } else {
            router.push('/user-preference');
          }
        } catch (error) {
          console.error('Error checking preferences:', error);
          router.push('/user-preference');
        }
      }
    };

    checkPreferences();
  }, [session, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-600">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-blue-900">Please wait...</h2>
        <p className="text-blue-700">We're checking your profile</p>
      </div>
    </div>
  );
}