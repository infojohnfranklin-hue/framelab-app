import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

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
      <div style={{ display: "flex" }}>
        <Sidebar userPlan={userPlan} />
        <div style={{ marginLeft: "260px", width: "100%" }}>
          <Component {...pageProps} />
        </div>
      </div>
    </ClerkProvider>
  );
}
