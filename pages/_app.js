import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ marginLeft: "260px", width: "100%" }}>
          <Component {...pageProps} />
        </div>
      </div>
    </ClerkProvider>
  );
}
