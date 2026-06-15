/// <reference types="vite/client" />

// leaflet.heat não publica tipos próprios; usamos (L as any).heatLayer no código.
declare module "leaflet.heat";
