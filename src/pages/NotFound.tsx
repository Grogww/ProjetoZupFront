import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <p className="text-sm text-muted-foreground">O endereço que você tentou acessar não existe no ZUP.</p>
        <Link to="/">
          <Button className="gap-2">
            <MapPin className="w-4 h-4" /> Voltar para o início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
