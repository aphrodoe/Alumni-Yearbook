'use client';

import { signIn, useSession } from "next-auth/react";
<<<<<<< HEAD
<<<<<<< Updated upstream
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
=======
import { redirect } from "next/navigation";
import { Button } from "../components/ui/button";
import PDFViewer from "../components/PDFViewer"; // Minimal addition
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
import { redirect } from "next/navigation";
import { Button } from "../components/ui/button";
>>>>>>> 8f5661b522d92aa6e285f84536344b1f451f4342

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

<<<<<<< HEAD
<<<<<<< Updated upstream
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10"
      style={{ backgroundImage: 'url("https://wallpaperaccess.com/full/1876582.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <Card className="w-full max-w-md p-6" style={{ backgroundColor: 'white', color: 'black' }}>
        <CardHeader className="flex flex-col items-center">
          <img src="/IITJ_logo.png" alt="Login Image" className="mb-4 w-32 h-32 object-cover rounded-full" />
          <div className="bg-dark-orange p-2 rounded">
            <CardTitle className="text-center" style={{ backgroundColor: '#FF8C00', color: 'white', padding: '10px', borderRadius: '5px' }}>
              SIGN IN / SIGN UP
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="w-full flex items-center justify-center gap-2">
            <FcGoogle size={20} />
            Sign in/Sign up with your Google account
          </Button>
        </CardContent>
      </Card>
    </div>
=======
  if (session) {
    return redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button onClick={() => signIn("google")}>Sign In with Google</Button>

      {/* PDF Viewer Added Below */}
      <div className="mt-10 w-full max-w-4xl">
        <PDFViewer />
      </div>
    </main>
>>>>>>> Stashed changes
=======
  if (session) {
    return (
      redirect("/dashboard")
    )
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button onClick={() => signIn("google")}>Sign In with Google</Button>
    </main>
>>>>>>> 8f5661b522d92aa6e285f84536344b1f451f4342
  );
}
