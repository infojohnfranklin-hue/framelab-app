import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/premium.css";

export default function App({ Component, pageProps }) {
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/me-plan?ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        const data = await res.json();
        setUserPlan(data.plan || "free");
      } catch (error) {
        console.error("Failed to load user plan:", error);
        setUserPlan("free");
      }
    }

    loadPlan();
  }, []);

  return (
    <ClerkProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          background: "#050505",
          color: "white",
          overflowX: "hidden",
        }}
      >
        <Sidebar userPlan={userPlan} />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: "100vh",
            background: "#050505",
          }}
        >
          <Component {...pageProps} />
        </main>
      </div>
    </ClerkProvider>
  );
}
