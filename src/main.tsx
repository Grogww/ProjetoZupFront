import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
// CSS do Leaflet (arquivo vendorizado manualmente — ver src/vendor/leaflet/README.md)
import "@/vendor/leaflet/leaflet.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
