import { useEffect, useState } from "react";
import videira1 from "@/assets/videira-1.jpg";
import videira2 from "@/assets/videira-2.jpg";
import videira3 from "@/assets/videira-3.jpg";
import videira4 from "@/assets/videira-4.jpg";
import videira5 from "@/assets/videira-5.jpg";

const SLIDES = [
  { src: videira1, alt: "Parque central de Videira com trilhos e fonte" },
  { src: videira2, alt: "Vista aérea do calçadão e rio em Videira" },
  { src: videira3, alt: "Igreja matriz de Videira em destaque" },
  { src: videira4, alt: "Vista panorâmica da cidade de Videira" },
  { src: videira5, alt: "Praça da matriz de Videira ao entardecer" },
];

const INTERVAL_MS = 7000;

const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-foreground">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
            i === index && loaded[i] ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 dark:from-black/90 dark:via-black/75 dark:to-black/50" />
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-primary-foreground" : "w-2 bg-primary-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
