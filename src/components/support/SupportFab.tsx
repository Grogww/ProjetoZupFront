import { Link, useLocation } from "react-router-dom";
import { LifeBuoy } from "lucide-react";

const HIDDEN_ROUTES = ["/suporte"];

const SupportFab = () => {
  const location = useLocation();
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  // Em /mapa mobile, sobe o FAB para não colidir com a barra inferior do mapa.
  const isMapRoute = location.pathname === "/mapa";

  return (
    <Link
      to="/suporte?source=fab"
      aria-label="Abrir central de ajuda"
      className={`fixed right-5 z-[1500] inline-flex items-center justify-center w-14 h-14 min-h-11 min-w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${
        isMapRoute ? "bottom-20 md:bottom-5" : "bottom-5"
      }`}
    >
      <LifeBuoy className="w-6 h-6" aria-hidden="true" />
      <span className="sr-only">Central de Ajuda</span>
    </Link>
  );
};

export default SupportFab;

