# Leaflet (CSS vendorizado)

Coloque aqui o **CSS oficial do Leaflet**, substituindo o conteúdo de
`leaflet.css` por:

- `node_modules/leaflet/dist/leaflet.css` (após `npm install`), ou
- https://unpkg.com/leaflet@1.9.4/dist/leaflet.css

O arquivo é importado globalmente em `src/main.tsx`:

```ts
import "@/vendor/leaflet/leaflet.css";
```

> O JavaScript do Leaflet vem do npm (`leaflet` / `react-leaflet`); só o CSS é
> mantido aqui manualmente, conforme decidido para este MVP.
