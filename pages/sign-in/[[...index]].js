import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, rgba(var(--premivate-gold-rgb),0.16), transparent 38%), #050505",
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        appearance={{
          variables: {
            colorPrimary: "rgb(var(--premivate-gold-rgb))",
            colorPrimaryForeground: "#17130C",
            colorBackground: "#0a0a0a",
            colorForeground: "#ffffff",
            colorInput: "#111111",
            colorInputForeground: "#ffffff",
            colorMuted: "#141414",
            colorMutedForeground: "rgba(255,255,255,0.62)",
            colorNeutral: "#cfc7b8",
            colorBorder: "rgba(var(--premivate-gold-rgb),0.28)",
            colorRing: "rgb(var(--premivate-gold-rgb))",
            colorShadow: "#000000",
            borderRadius: "16px",
          },
          elements: {
            socialButtonsBlockButton: {
              backgroundColor: "#111111",
              border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
              color: "#f5f1e8",
              boxShadow: "none",
              "&:hover, &:focus, &:active": {
                backgroundColor: "#17130C",
                borderColor: "rgba(var(--premivate-gold-rgb),0.58)",
                color: "#ffffff",
              },
            },
          },
        }}
      />
    </div>
  );
}
