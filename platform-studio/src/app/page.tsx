"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to studio dashboard
    router.push("/studio");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Platform Studio</h1>
        <p className="text-gray-500 mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
