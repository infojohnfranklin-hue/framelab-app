import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("isPro", "true");
    localStorage.setItem("credits", "999");

    setTimeout(() => {
      router.push("/");
    }, 1500);
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05030a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
      }}
    >
      <div>
        <h1>Welcome to FrameLab Pro 🚀</h1>
        <p>Your subscription is active. Redirecting...</p>
      </div>
    </main>
  );
}