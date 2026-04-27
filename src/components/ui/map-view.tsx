import { useEffect, useMemo, useRef } from "react";
import type { Listing } from "@/lib/store";

// leaflet runtime CDN'den (index.html) yükleniyor; tipler için any yeterli.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletGlobal = any;

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

export interface MapViewProps {
  listings: Listing[];
  onOpen?: (id: string) => void;
  height?: number;
}

const statusColor: Record<string, string> = {
  Aktif: "#3F362D",
  Taslak: "#A78554",
  Pasif: "#8A8175",
};

const statusBadgeBg: Record<string, string> = {
  Aktif: "rgba(63,54,45,0.12)",
  Taslak: "rgba(167,133,84,0.18)",
  Pasif: "rgba(138,129,117,0.18)",
};

const cities = [
  { name: "İstanbul", center: [41.02, 28.97] as [number, number], z: 11 },
  { name: "Ankara", center: [39.93, 32.85] as [number, number], z: 11 },
  { name: "İzmir", center: [38.42, 27.14] as [number, number], z: 11 },
  { name: "Antalya", center: [36.9, 30.7] as [number, number], z: 11 },
  { name: "Çanakkale", center: [39.65, 26.45] as [number, number], z: 11 },
  { name: "Muğla", center: [37.0, 28.0] as [number, number], z: 9 },
  { name: "Türkiye", center: [39.0, 35.5] as [number, number], z: 6 },
];

export function MapView({ listings, onOpen, height = 640 }: MapViewProps) {
  const mapRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clusterRef = useRef<unknown>(null);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current || !window.L) return;
    const L = window.L as LeafletGlobal;

    const map = L.map(containerRef.current, {
      center: [39.0, 35.5],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    map.setMaxBounds([
      [35.5, 25.0],
      [43.0, 45.5],
    ]);
    mapRef.current = map;

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: (c: { getChildCount: () => number }) => {
        const count = c.getChildCount();
        const size = count < 10 ? 32 : count < 50 ? 38 : 44;
        return L.divIcon({
          html: `<div class="atelier-cluster-inner">${count}</div>`,
          className: "atelier-cluster",
          iconSize: L.point(size, size),
        });
      },
    });
    map.addLayer(cluster as never);
    clusterRef.current = cluster;

    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const cluster = clusterRef.current as
      | { clearLayers: () => void; addLayer: (m: unknown) => void }
      | null;
    if (!L || !cluster) return;
    cluster.clearLayers();

    listings
      .filter((l) => typeof l.lat === "number" && typeof l.lng === "number")
      .forEach((l) => {
        const color = statusColor[l.status] ?? statusColor.Aktif;
        const bgColor = statusBadgeBg[l.status] ?? statusBadgeBg.Aktif;
        const icon = L.divIcon({
          html: `
            <div class="atelier-pin" style="--pc:${color}">
              <div class="atelier-pin-bubble">${l.price}</div>
              <div class="atelier-pin-stem"></div>
            </div>`,
          className: "atelier-pin-wrap",
          iconSize: [70, 42],
          iconAnchor: [35, 42],
        });
        const marker = L.marker([l.lat as number, l.lng as number], { icon });
        const popupHtml = `
          <div class="atelier-popup">
            <div class="atelier-popup-id">${l.id}</div>
            <div class="atelier-popup-title">${l.loc.replace(/</g, "&lt;")}</div>
            <div class="atelier-popup-meta">${l.area}${
              l.tag ? ` · ${l.tag}` : ""
            }</div>
            <div class="atelier-popup-row">
              <span class="atelier-popup-price">${l.price}</span>
              <span class="atelier-popup-badge" style="background:${bgColor};color:${color}">${l.status}</span>
            </div>
            <button class="atelier-popup-btn" data-id="${l.id}">Detayı aç →</button>
          </div>`;
        marker.bindPopup(popupHtml, {
          maxWidth: 280,
          className: "atelier-popup-wrap",
        });
        marker.on("popupopen", (e: { popup: { getElement: () => HTMLElement } }) => {
          const btn = e.popup.getElement().querySelector(".atelier-popup-btn");
          if (btn) {
            (btn as HTMLButtonElement).onclick = (ev: Event) => {
              ev.preventDefault();
              ev.stopPropagation();
              (mapRef.current as { closePopup: () => void } | null)?.closePopup();
              setTimeout(() => onOpenRef.current?.(l.id), 0);
            };
          }
        });
        cluster.addLayer(marker);
      });
  }, [listings]);

  const counts = useMemo(
    () => ({
      aktif: listings.filter((l) => l.status === "Aktif").length,
      taslak: listings.filter((l) => l.status === "Taslak").length,
      pasif: listings.filter((l) => l.status === "Pasif").length,
    }),
    [listings],
  );

  const flyTo = (center: [number, number], z: number) => {
    (
      mapRef.current as
        | { flyTo: (c: [number, number], z: number, opts?: object) => void }
        | null
    )?.flyTo(center, z, { duration: 0.8 });
  };

  return (
    <div
      style={{ height }}
      className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/50"
    >
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-foreground" />
          Aktif <span className="font-semibold tabular-nums text-foreground">{counts.aktif}</span>
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-300" />
          Taslak <span className="font-semibold tabular-nums text-foreground">{counts.taslak}</span>
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-stone-400" />
          Pasif <span className="font-semibold tabular-nums text-foreground">{counts.pasif}</span>
        </span>
      </div>

      <div className="absolute bottom-3 left-3 z-[500] flex max-w-[calc(100%-100px)] flex-wrap gap-1">
        {cities.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => flyTo(p.center, p.z)}
            className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-background hover:text-foreground"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
