import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { faqData } from "@/data/faqData";

const FaqAccordion = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqData;
    return faqData
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query]);

  return (
    <section aria-labelledby="faq-heading" className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 id="faq-heading" className="text-2xl font-bold text-foreground">Perguntas Frequentes</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pergunta..."
            aria-label="Buscar no FAQ"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">Nenhuma pergunta encontrada para "{query}".</p>
          <p className="text-sm text-muted-foreground mt-2">Tente outra palavra ou entre em contato pelo formulário abaixo.</p>
        </div>
      ) : (
        filtered.map((cat) => (
          <div key={cat.id} id={cat.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-3 text-primary">{cat.title}</h3>
            <Accordion type="single" collapsible className="w-full">
              {cat.items.map((it, idx) => (
                <AccordionItem key={idx} value={`${cat.id}-${idx}`}>
                  <AccordionTrigger className="text-left text-foreground">{it.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{it.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}
    </section>
  );
};

export default FaqAccordion;
