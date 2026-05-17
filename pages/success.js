import { useEffect } from "react";
import Link from "next/link";

export default function Success() {
  useEffect(() => {
    localStorage.setItem("credits", "999");
    localStorage.setItem("isPro", "true");
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Payment successful ✅</h1>
      <p>Your Pro access has been unlocked.</p>

      <Link href="/">
        Back to FrameLab
      </Link>
    </main>
  );
}