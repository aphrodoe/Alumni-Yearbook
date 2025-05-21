"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // If user is authenticated, redirect to loading page
    if (status === "authenticated") {
      router.push("/auth/loading");
    }
  }, [status, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signIn("google", { 
        callbackUrl: "/auth/loading",
        redirect: false // Important: don't redirect automatically
      });
      
      if (result?.error) {
        // Handle authentication errors
        if (result.error === "AccessDenied") {
          toast.error("Access denied. This email is not authorized to use the yearbook.");
        } else {
          toast.error("Failed to sign in. Please try again.");
        }
      }
      // NextAuth will handle the successful login and redirect
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-blue-900">Loading...</h2>
        </div>
      </div>
    );
  }

  // Only show login form if user is not authenticated
  if (status === "unauthenticated") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-600 p-6",
          className
        )}
        {...props}
      >
        <Card className="w-full max-w-md shadow-2xl border border-blue-300 bg-white rounded-xl">
          <CardHeader className="text-center p-6">
            {/* Logo and header content */}
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="relative w-32 h-32">
                <Image
                  src="/IITJ_logo.png"
                  alt="IITJ Logo"
                  fill
                  className="object-cover rounded-full shadow-lg"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="relative w-32 h-32">
                <Image
                  src="/SAA_logo.png"
                  alt="SAA Logo"
                  fill
                  className="object-cover rounded-full shadow-lg"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-blue-900">Welcome to the Yearbook</h2>
            <CardDescription className="text-blue-700 mt-2 text-lg">
              Relive memories, reconnect with friends
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center text-blue-900 border-blue-500 hover:bg-blue-200 transition-all shadow-sm"
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-900 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 mr-2"
                    >
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-gray-600 mt-2">
                Note: Only authorized for graduating students of IIT Jodhpur.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}