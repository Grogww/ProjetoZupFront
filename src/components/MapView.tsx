import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  GeoJSON,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { type Report, getStatusColor, currentMunicipality } from "@/data/mockData";
import { useNeighborhoodBoundaries } from "@/hooks/useNeighborhoodBoundaries";

interface MapViewProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  onReportClick?: (report: Report) => void;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
  showNeighborhoodBoundaries?: boolean;
}

// Estilo dos contornos de bairro: claro e bem translúcido para não atrapalhar a
// leitura do mapa nem dos pins. `interactive: false` deixa o clique passar para o
// mapa (essencial no cadastro, onde o clique marca o local da ocorrência).
const NEIGHBORHOOD_STYLE: L.PathOptions = {
  color: "hsl(262, 45%, 60%)",
  weight: 1,
  opacity: 0.55,
  fillColor: "hsl(262, 70%, 72%)",
  fillOpacity: 0.07,
  interactive: false,
};

const pinSvg = (color: string) =>
  `data:image/svg+xml;utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="5" fill="white"/>
    </svg>`
  )}`;

const reportIcon = (color: string) =>
  L.icon({
    iconUrl: pinSvg(color),
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    tooltipAnchor: [0, -34],
  });

// Captura cliques no mapa (substitui o addListener("click") do Google).
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recentraliza ao mudar a prop `center` (sem alterar o zoom atual).
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

// Faz pan até o ponto selecionado.
function PanToSelected({ position }: { position?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MapView = ({
  reports,
  center = currentMunicipality.center,
  zoom = currentMunicipality.zoom,
  onReportClick,
  className = "",
  onMapClick,
  selectedPosition,
  showNeighborhoodBoundaries = true,
}: MapViewProps) => {
  // Contornos REAIS dos bairros (GeoJSON do back, PostGIS). Só busca quando o mapa
  // pede — substitui os antigos hexágonos desenhados em volta de centros chutados.
  const { boundaries } = useNeighborhoodBoundaries(showNeighborhoodBoundaries);

  return (
    // `isolate z-0` cria um stacking context próprio: nada do mapa (controles,
    // popups, panes do Leaflet) sobrepõe modais/dropdowns da aplicação.
    <div
      className={`relative isolate z-0 w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-muted ${className}`}
    >
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="w-full h-full min-h-[400px]">
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
        <Recenter center={center} />
        <PanToSelected position={selectedPosition} />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}

        {boundaries.map((b) => (
          <GeoJSON key={b.id} data={b.boundary} style={() => NEIGHBORHOOD_STYLE}>
            <Tooltip permanent direction="center" className="zup-neighborhood-label">
              {b.name}
            </Tooltip>
          </GeoJSON>
        ))}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={reportIcon(getStatusColor(report.status))}
            eventHandlers={onReportClick ? { click: () => onReportClick(report) } : undefined}
          >
            <Tooltip direction="top">
              <strong>{report.title}</strong>
              <br />
              <span style={{ fontSize: 11, color: "#666" }}>{report.neighborhood}</span>
            </Tooltip>
          </Marker>
        ))}

        {selectedPosition && (
          <CircleMarker
            center={selectedPosition}
            radius={9}
            pathOptions={{
              color: "#fff",
              weight: 3,
              fillColor: "hsl(262, 60%, 45%)",
              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
