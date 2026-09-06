import { useEffect, useRef, useState } from "react";
import type {
    GeoJSONSource,
    Map as MapLibreMap,
    Marker as MapLibreMarker,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { TripPlace } from "../../../places/model";
import type { PlaceSearchResult } from "../../../places/search";
import type { CountryCode } from "../../../trips/countries";
import styles from "./TripMap.module.css";
import {
    countryViews,
    createRouteData,
    defaultMapStyleUrl,
    routeCasingLayerId,
    routeLayerId,
    routeSourceId,
} from "./trip-map-model";

type TripMapProps = {
    countryCode: CountryCode;
    countryName: string;
    focusRequest: number;
    focusedPlaceId: string | null;
    onPlaceSelect: (placeId: string) => void;
    places: readonly TripPlace[];
    searchPlace?: PlaceSearchResult | null;
};

const mapStyleUrl =
    import.meta.env.VITE_MAP_STYLE_URL?.trim() || defaultMapStyleUrl;

type MapStatus = "loading" | "ready" | "failed";

type PlaceMarker = {
    badge: HTMLSpanElement;
    element: HTMLButtonElement;
    marker: MapLibreMarker;
};

type SearchMarker = {
    element: HTMLDivElement;
    marker: MapLibreMarker;
};

export function TripMap({
    countryCode,
    countryName,
    focusRequest,
    focusedPlaceId,
    onPlaceSelect,
    places,
    searchPlace = null,
}: TripMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef(new Map<string, PlaceMarker>());
    const searchMarkerRef = useRef<SearchMarker | null>(null);
    const onPlaceSelectRef = useRef(onPlaceSelect);
    const [status, setStatus] = useState<MapStatus>("loading");
    const [loadAttempt, setLoadAttempt] = useState(0);
    const focusedPlace = places.find((place) => place.id === focusedPlaceId);
    const focusedLatitude =
        searchPlace?.coordinates.latitude ?? focusedPlace?.coordinates.latitude;
    const focusedLongitude =
        searchPlace?.coordinates.longitude ??
        focusedPlace?.coordinates.longitude;

    useEffect(() => {
        onPlaceSelectRef.current = onPlaceSelect;
    }, [onPlaceSelect]);

    useEffect(() => {
        const container = containerRef.current;
        const markers = markerRef.current;

        if (!container) {
            return;
        }

        let disposed = false;
        let loaded = false;
        let loadTimeout: number | undefined;
        const view = countryViews[countryCode];

        setStatus("loading");

        const initializeMap = async () => {
            try {
                const { Map, NavigationControl } = await import("maplibre-gl");

                if (disposed) {
                    return;
                }

                if (
                    !("WebGLRenderingContext" in window) &&
                    !("WebGL2RenderingContext" in window)
                ) {
                    setStatus("failed");
                    return;
                }

                const map = new Map({
                    container,
                    style: mapStyleUrl,
                    center: view.center,
                    zoom: view.zoom,
                    attributionControl: { compact: true },
                    dragRotate: false,
                    pitchWithRotate: false,
                });
                mapRef.current = map;
                map.addControl(
                    new NavigationControl({
                        showCompass: false,
                        showZoom: true,
                    }),
                    "bottom-left",
                );

                loadTimeout = window.setTimeout(() => {
                    if (!loaded && !disposed) {
                        setStatus("failed");
                    }
                }, 10000);

                map.once("load", () => {
                    loaded = true;
                    window.clearTimeout(loadTimeout);

                    if (!disposed) {
                        setStatus("ready");
                    }
                });
            } catch {
                if (!disposed) {
                    setStatus("failed");
                }
            }
        };

        void initializeMap();

        return () => {
            disposed = true;
            window.clearTimeout(loadTimeout);
            markers.forEach(({ marker }) => marker.remove());
            markers.clear();
            searchMarkerRef.current?.marker.remove();
            searchMarkerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, [countryCode, loadAttempt]);

    useEffect(() => {
        const map = mapRef.current;

        if (status !== "ready" || !map) {
            return;
        }

        let disposed = false;

        const syncMarkers = async () => {
            const { Marker } = await import("maplibre-gl");

            if (disposed || mapRef.current !== map) {
                return;
            }

            const placeIds = new Set(places.map((place) => place.id));

            markerRef.current.forEach(({ marker }, placeId) => {
                if (!placeIds.has(placeId)) {
                    marker.remove();
                    markerRef.current.delete(placeId);
                }
            });

            places.forEach((place) => {
                const markerLabel =
                    place.order === null ? "•" : String(place.order + 1);
                const selected = place.id === focusedPlaceId;
                let placeMarker = markerRef.current.get(place.id);

                if (!placeMarker) {
                    const element = document.createElement("button");
                    const badge = document.createElement("span");

                    element.type = "button";
                    element.className = styles.marker;
                    badge.className = styles.markerBadge;
                    badge.setAttribute("aria-hidden", "true");
                    element.append(badge);
                    element.addEventListener("click", (event) => {
                        event.stopPropagation();
                        onPlaceSelectRef.current(place.id);
                    });

                    placeMarker = {
                        badge,
                        element,
                        marker: new Marker({
                            anchor: "bottom",
                            element,
                        })
                            .setLngLat([
                                place.coordinates.longitude,
                                place.coordinates.latitude,
                            ])
                            .addTo(map),
                    };
                    markerRef.current.set(place.id, placeMarker);
                } else {
                    placeMarker.marker.setLngLat([
                        place.coordinates.longitude,
                        place.coordinates.latitude,
                    ]);
                }

                placeMarker.badge.textContent = markerLabel;
                placeMarker.element.setAttribute(
                    "aria-label",
                    `지도에서 ${place.name} 보기`,
                );
                placeMarker.element.setAttribute(
                    "aria-pressed",
                    String(selected),
                );
                placeMarker.element.dataset.selected = selected
                    ? "true"
                    : "false";
            });

            if (!searchPlace) {
                searchMarkerRef.current?.marker.remove();
                searchMarkerRef.current = null;
                return;
            }

            let searchMarker = searchMarkerRef.current;

            if (!searchMarker) {
                const element = document.createElement("div");
                const badge = document.createElement("span");

                element.className = `${styles.marker} ${styles.searchMarker}`;
                element.setAttribute("role", "img");
                badge.className = styles.markerBadge;
                badge.setAttribute("aria-hidden", "true");
                badge.textContent = "•";
                element.append(badge);

                searchMarker = {
                    element,
                    marker: new Marker({ anchor: "bottom", element })
                        .setLngLat([
                            searchPlace.coordinates.longitude,
                            searchPlace.coordinates.latitude,
                        ])
                        .addTo(map),
                };
                searchMarkerRef.current = searchMarker;
            }

            searchMarker.element.setAttribute(
                "aria-label",
                `${searchPlace.name} 검색 위치`,
            );
            searchMarker.marker.setLngLat([
                searchPlace.coordinates.longitude,
                searchPlace.coordinates.latitude,
            ]);
        };

        void syncMarkers();

        return () => {
            disposed = true;
        };
    }, [focusedPlaceId, places, searchPlace, status]);

    useEffect(() => {
        const map = mapRef.current;

        if (status !== "ready" || !map) {
            return;
        }

        const routeData = createRouteData(places);
        const routeSource = map.getSource(routeSourceId) as
            GeoJSONSource | undefined;

        if (routeSource) {
            routeSource.setData(routeData);
        } else {
            map.addSource(routeSourceId, {
                type: "geojson",
                data: routeData,
            });
        }

        const firstSymbolLayerId = map
            .getStyle()
            .layers?.find((layer) => layer.type === "symbol")?.id;

        if (!map.getLayer(routeCasingLayerId)) {
            map.addLayer(
                {
                    id: routeCasingLayerId,
                    type: "line",
                    source: routeSourceId,
                    layout: {
                        "line-cap": "round",
                        "line-join": "round",
                    },
                    paint: {
                        "line-color": "#ffffff",
                        "line-opacity": 0.9,
                        "line-width": 6,
                    },
                },
                firstSymbolLayerId,
            );
        }

        if (!map.getLayer(routeLayerId)) {
            map.addLayer(
                {
                    id: routeLayerId,
                    type: "line",
                    source: routeSourceId,
                    layout: {
                        "line-cap": "round",
                        "line-join": "round",
                    },
                    paint: {
                        "line-color": "#000000",
                        "line-dasharray": [2, 1.5],
                        "line-opacity": 0.8,
                        "line-width": 2.5,
                    },
                },
                firstSymbolLayerId,
            );
        }
    }, [places, status]);

    useEffect(() => {
        const map = mapRef.current;
        const container = containerRef.current;

        if (
            status !== "ready" ||
            !map ||
            !container ||
            focusedLatitude === undefined ||
            focusedLongitude === undefined
        ) {
            return;
        }

        const isDesktop = window.matchMedia?.("(min-width: 920px)").matches;
        const prefersReducedMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        map.easeTo({
            center: [focusedLongitude, focusedLatitude],
            zoom: 15,
            duration: prefersReducedMotion ? 0 : 700,
            essential: true,
            offset: isDesktop
                ? [0, 0]
                : [0, -Math.round(container.clientHeight * 0.25)],
        });
    }, [focusRequest, focusedLatitude, focusedLongitude, status]);

    return (
        <section
            className={styles.root}
            aria-busy={status === "loading"}
            aria-label={`${countryName} 여행 지도`}
            role="region"
        >
            <div className={styles.map} ref={containerRef} />

            {status === "loading" ? (
                <div className={styles.overlay} role="status">
                    지도 불러오는 중
                </div>
            ) : null}

            {status === "failed" ? (
                <div className={`${styles.overlay} ${styles.error}`}>
                    <p role="alert">지도를 불러오지 못했습니다.</p>
                    <button
                        type="button"
                        onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                    >
                        다시 시도
                    </button>
                </div>
            ) : null}
        </section>
    );
}
