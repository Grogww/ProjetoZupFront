import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, ShieldCheck, LogOut, Moon, Sun } from "lucide-react";
import { useAuth, isInstitutional, isAdmin } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import zupLogo from "@/assets/zup-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const institutional = isInstitutional(roles);
  const admin = isAdmin(roles);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const links = [
    { href: "/mapa", label: "Mapa" },
    { href: "/dashboard", label: "Minha Cidade" },
    { href: "/gestao", label: "Gestão" },
    { href: "/painel", label: "Meu Painel" },
    { href: "/suporte?source=navbar", label: "Ajuda", match: "/suporte" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-[1000]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={zupLogo} alt="ZUP" className="w-11 h-11 rounded-xl object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold leading-tight text-foreground">ZUP</span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">Zeladoria Urbana Participativa</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(link => {
              const active = location.pathname === (link.match ?? link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Alternar tema" title={theme === "dark" ? "Modo claro" : "Modo noturno"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {institutional && (
              <Link to="/gestao/painel">
                <Button variant="ghost" size="sm" className="text-primary">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Painel Gestão
                </Button>
              </Link>
            )}
            {admin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Painel de administração" title="Admin">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" /> Sair
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link to="/cadastro">
                  <Button size="sm">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <button className="p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in">
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {institutional && (
              <Link
                to="/gestao/painel"
                className="block px-3 py-2 rounded-md text-sm text-primary font-medium hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck className="w-4 h-4 inline mr-1" /> Painel Gestão
              </Link>
            )}
            <div className="flex gap-2 px-3 pt-3 border-t border-border mt-2">
              {user ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                  <LogOut className="w-4 h-4 mr-1" /> Sair
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/cadastro" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full">Criar Conta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
