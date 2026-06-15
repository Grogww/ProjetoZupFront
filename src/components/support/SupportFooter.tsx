import { Link } from "react-router-dom";

const SupportFooter = () => {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ZUP — Zeladoria Urbana Participativa · Videira/SC</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          <Link to="/suporte?source=footer" className="hover:text-foreground transition-colors">Suporte</Link>
          <Link to="/suporte?source=footer#privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          <Link to="/suporte?source=footer#termos" className="hover:text-foreground transition-colors">Termos</Link>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Minha Cidade</Link>
        </nav>
      </div>
    </footer>
  );
};

export default SupportFooter;
