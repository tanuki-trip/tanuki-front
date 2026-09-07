export type MapStyleId = "positron" | "bright" | "liberty" | "dark";

export const defaultMapStyleId: MapStyleId = "positron";

const mapStyleStorageKeyPrefix = "tanuki:trip-map-style:v1:";

export const mapStyleOptions = [
    { id: "positron", label: "심플 (기본)" },
    { id: "bright", label: "밝게" },
    { id: "liberty", label: "컬러" },
    { id: "dark", label: "다크" },
] as const satisfies readonly { id: MapStyleId; label: string }[];

const mapStyleUrls: Record<MapStyleId, string> = {
    positron: "https://tiles.openfreemap.org/styles/positron",
    bright: "https://tiles.openfreemap.org/styles/bright",
    liberty: "https://tiles.openfreemap.org/styles/liberty",
    dark: "https://tiles.openfreemap.org/styles/dark",
};

export function getMapStyleUrl(mapStyleId: MapStyleId) {
    return mapStyleUrls[mapStyleId];
}

export function isMapStyleId(value: unknown): value is MapStyleId {
    return mapStyleOptions.some((option) => option.id === value);
}

function getMapStyleStorageKey(tripId: string) {
    return `${mapStyleStorageKeyPrefix}${tripId}`;
}

export function getStoredTripMapStyle(tripId: string): MapStyleId {
    try {
        const storedStyle = window.localStorage.getItem(
            getMapStyleStorageKey(tripId),
        );

        return isMapStyleId(storedStyle) ? storedStyle : defaultMapStyleId;
    } catch {
        return defaultMapStyleId;
    }
}

export function storeTripMapStyle(tripId: string, mapStyleId: MapStyleId) {
    try {
        window.localStorage.setItem(getMapStyleStorageKey(tripId), mapStyleId);
        return true;
    } catch {
        return false;
    }
}
