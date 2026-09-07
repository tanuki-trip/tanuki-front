import {
    defaultMapStyleId,
    getMapStyleUrl,
    type MapStyleId,
} from "../../../trips/map-style";

const configuredDefaultMapStyleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim();
const prewarmedStyleUrls = new Set<string>();

export function resolveTripMapStyleUrl(mapStyleId: MapStyleId) {
    if (mapStyleId === defaultMapStyleId && configuredDefaultMapStyleUrl) {
        return configuredDefaultMapStyleUrl;
    }

    return getMapStyleUrl(mapStyleId);
}

async function requestMapStyle(mapStyleUrl: string, signal?: AbortSignal) {
    const response = await fetch(mapStyleUrl, { signal });

    if (!response.ok) {
        throw new Error(`Map style request failed with ${response.status}`);
    }

    await response.arrayBuffer();
}

export async function prewarmTripMapResources(mapStyleUrl: string) {
    await Promise.all([import("maplibre-gl"), requestMapStyle(mapStyleUrl)]);
    prewarmedStyleUrls.add(mapStyleUrl);
}

export async function loadTripMapResources(
    mapStyleUrl: string,
    signal: AbortSignal,
) {
    const [mapLibre] = await Promise.all([
        import("maplibre-gl"),
        prewarmedStyleUrls.has(mapStyleUrl)
            ? Promise.resolve()
            : requestMapStyle(mapStyleUrl, signal),
    ]);

    return mapLibre;
}
