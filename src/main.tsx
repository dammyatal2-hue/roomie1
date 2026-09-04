
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./app/auth/AuthProvider";
import { Analytics } from "@vercel/analytics/react";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  );
  
