import { useEffect } from "react";

export default function Success({ ui, t }) {
  const _t =
    typeof t === "function"
      ? t
      : (value) => value;

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms) =>
      new Promise((resolve) =>
        setTimeout(resolve, ms)
      );

    async function waitForServerPlan() {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (cancelled) return;

        try {
          const res = await fetch(
            `/api/me-plan?ts=${Date.now()}`,
            {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          );

          if (res.ok) {
            const data = await res.json();

            if (data.plan === "pro") {
              window.location.href = "/";
              return;
            }
          }
        } catch (error) {
          console.error(
            "Failed to confirm Pro activation:",
            error
          );
        }

        await sleep(500);
      }

      if (!cancelled) {
        window.location.href = "/";
      }
    }

    waitForServerPlan();

    return () => {
      cancelled = true;
    };
  }, []);

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
        <h1>{ui.success.title}</h1>
        <p>{ui.success.redirecting}</p>
      </div>
    </main>
  );
}
