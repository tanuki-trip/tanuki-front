import type { CountryCode } from "../trips/countries";

export type PlaceSearchResult = {
    id: string;
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
};

export type PlaceSearchOptions = {
    center?: {
        latitude: number;
        longitude: number;
    };
    region?: string;
    signal?: AbortSignal;
};

export type PlaceSearchErrorKind =
    "invalid-response" | "rate-limit" | "request-failed";

export class PlaceSearchError extends Error {
    readonly kind: PlaceSearchErrorKind;

    constructor(kind: PlaceSearchErrorKind, message: string) {
        super(message);
        this.name = "PlaceSearchError";
        this.kind = kind;
    }
}

const nominatimSearchUrl = "https://nominatim.openstreetmap.org/search";
const gsiAddressSearchUrl =
    "https://msearch.gsi.go.jp/address-search/AddressSearch";
const minimumRequestIntervalMs = 1_100;
const searchViewSpanDegrees = 0.8;
const maximumResultCount = 10;
const searchCache = new Map<string, readonly PlaceSearchResult[]>();

const buildingNamePattern =
    /(?:빌딩|건물|타워|호텔|マンション|アパート|ビル|タワー|ホテル|大厦|酒店|building|bldg\.?|tower|hotel)/i;
const placeNamePattern =
    /(?:빌딩|건물|타워|호텔|박물관|미술관|공원|역|공항|マンション|アパート|ビル|タワー|ホテル|旅館|駅|空港|寺|神社|博物館|美術館|公園|大厦|酒店|博物馆|美术馆|公园|站|building|bldg\.?|tower|hotel|museum|gallery|park|station|airport|mall|centre|center|temple|shrine|restaurant|cafe|store)$/i;
const romanizedLongVowelReplacements: Readonly<Record<string, string>> = {
    Ā: "A",
    ā: "a",
    Ē: "E",
    ē: "e",
    Ī: "I",
    ī: "i",
    Ō: "O",
    ō: "o",
    Ū: "U",
    ū: "u",
};

let nextRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizePlaceSearchQuery(query: string) {
    return query
        .normalize("NFC")
        .replace(
            /[ĀāĒēĪīŌōŪū]/g,
            (character) =>
                romanizedLongVowelReplacements[character] ?? character,
        )
        .replace(/[‐‑‒–—―−﹘﹣－]/g, "-")
        .replace(/\s*-\s*/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .normalize("NFC");
}

function removeUnitSpecifier(query: string) {
    const explicitUnitSuffix =
        /(?:[,，]\s*|\s+)(?:(?:room|suite|unit|apt\.?|apartment)\s*[a-z0-9-]+|[bB]?\d{1,4}[fF]|\d{1,4}\s*(?:号室|室|호|호실|층|階))$/i;
    const withoutExplicitUnit = query.replace(explicitUnitSuffix, "").trim();

    if (withoutExplicitUnit !== query) {
        return withoutExplicitUnit;
    }

    const bareUnitMatch = query.match(/(?:[,，]\s*|\s+)(\d{1,4})$/);

    if (!bareUnitMatch || bareUnitMatch.index === undefined) {
        return query;
    }

    const prefix = query.slice(0, bareUnitMatch.index);

    return buildingNamePattern.test(prefix) ? prefix.trim() : query;
}

function splitAddressAndPlace(query: string, countryCode: CountryCode) {
    const countryPatterns: Partial<Record<CountryCode, readonly RegExp[]>> = {
        JP: [
            /^(.+?(?:\d+(?:-\d+){1,}|\d+丁目\d+(?:番地?|番)\d*(?:号)?))[\s,，]+(.+)$/,
        ],
        KR: [/^(.+?(?:(?:대로|로|길)\s*)\d+(?:-\d+)?)[\s,，]+(.+)$/],
        CN: [/^(.+?(?:路|街|道|巷|弄)\d+号)[\s,，]+(.+)$/],
    };

    for (const pattern of countryPatterns[countryCode] ?? []) {
        const match = query.match(pattern);

        if (match?.[1] && match[2] && placeNamePattern.test(match[2].trim())) {
            return {
                address: match[1].trim(),
                place: match[2].trim(),
            };
        }
    }

    const segments = query
        .split(/[,，]/)
        .map((segment) => segment.trim())
        .filter(Boolean);
    const [firstSegment, ...addressSegments] = segments;

    if (
        firstSegment &&
        addressSegments.length > 0 &&
        placeNamePattern.test(firstSegment) &&
        addressSegments.some((segment) => /\d/.test(segment))
    ) {
        return {
            address: addressSegments.join(", "),
            place: firstSegment,
        };
    }

    return null;
}

function addRegion(query: string, region?: string) {
    const normalizedRegion = region?.trim();

    if (
        !normalizedRegion ||
        query
            .toLocaleLowerCase("ko-KR")
            .includes(normalizedRegion.toLocaleLowerCase("ko-KR"))
    ) {
        return query;
    }

    return `${query}, ${normalizedRegion}`;
}

export function createPlaceSearchQueries(
    query: string,
    countryCode: CountryCode,
    region?: string,
) {
    const normalizedQuery = normalizePlaceSearchQuery(query);
    const queryWithoutUnit = removeUnitSpecifier(normalizedQuery);
    const splitQuery = splitAddressAndPlace(queryWithoutUnit, countryCode);

    if (!splitQuery) {
        return [queryWithoutUnit];
    }

    return [
        addRegion(splitQuery.place, region),
        splitQuery.address,
        queryWithoutUnit,
    ].filter((candidate, index, candidates) => {
        const normalizedCandidate = candidate.toLocaleLowerCase("ko-KR");

        return (
            candidates.findIndex(
                (value) =>
                    value.toLocaleLowerCase("ko-KR") === normalizedCandidate,
            ) === index
        );
    });
}

function createResultId(
    item: Record<string, unknown>,
    latitude: number,
    longitude: number,
) {
    const osmType = asNonEmptyString(item.osm_type);
    const osmId =
        typeof item.osm_id === "number" || typeof item.osm_id === "string"
            ? String(item.osm_id)
            : null;

    if (osmType && osmId) {
        return `${osmType}-${osmId}`;
    }

    const placeId =
        typeof item.place_id === "number" || typeof item.place_id === "string"
            ? String(item.place_id)
            : null;

    return placeId
        ? `nominatim-${placeId}`
        : `coordinates-${latitude}-${longitude}`;
}

export function parseNominatimSearchResults(
    payload: unknown,
): PlaceSearchResult[] {
    if (!Array.isArray(payload)) {
        throw new PlaceSearchError(
            "invalid-response",
            "장소 검색 응답 형식이 올바르지 않습니다.",
        );
    }

    const seenIds = new Set<string>();

    return payload.flatMap((value) => {
        if (!isRecord(value)) {
            return [];
        }

        const latitude = Number(value.lat);
        const longitude = Number(value.lon);
        const displayName = asNonEmptyString(value.display_name);
        const name =
            asNonEmptyString(value.name) ??
            displayName?.split(",", 1)[0]?.trim() ??
            null;

        if (
            !name ||
            !displayName ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return [];
        }

        const id = createResultId(value, latitude, longitude);

        if (seenIds.has(id)) {
            return [];
        }

        seenIds.add(id);

        const repeatedName = `${name}, `;
        const address = displayName.startsWith(repeatedName)
            ? displayName.slice(repeatedName.length)
            : displayName;

        return [
            {
                id,
                name,
                address,
                coordinates: { latitude, longitude },
            },
        ];
    });
}

export function parseGsiAddressSearchResults(
    payload: unknown,
    placeName?: string,
): PlaceSearchResult[] {
    if (!Array.isArray(payload)) {
        throw new PlaceSearchError(
            "invalid-response",
            "일본 주소 검색 응답 형식이 올바르지 않습니다.",
        );
    }

    return payload.flatMap((value) => {
        if (!isRecord(value) || !isRecord(value.geometry)) {
            return [];
        }

        const coordinates = value.geometry.coordinates;
        const properties = isRecord(value.properties) ? value.properties : null;
        const address = properties ? asNonEmptyString(properties.title) : null;

        if (!Array.isArray(coordinates) || !address) {
            return [];
        }

        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return [];
        }

        return [
            {
                id: `gsi-${latitude}-${longitude}`,
                name: placeName?.trim() || address,
                address,
                coordinates: { latitude, longitude },
            },
        ];
    });
}

function waitForTurn(delayMs: number, signal?: AbortSignal) {
    if (signal?.aborted) {
        return Promise.reject(signal.reason);
    }

    if (delayMs <= 0) {
        return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            signal?.removeEventListener("abort", handleAbort);
            resolve();
        }, delayMs);

        function handleAbort() {
            window.clearTimeout(timeout);
            reject(signal?.reason);
        }

        signal?.addEventListener("abort", handleAbort, { once: true });
    });
}

function addLocationBias(url: URL, center?: PlaceSearchOptions["center"]) {
    if (
        !center ||
        !Number.isFinite(center.latitude) ||
        !Number.isFinite(center.longitude) ||
        center.latitude < -90 ||
        center.latitude > 90 ||
        center.longitude < -180 ||
        center.longitude > 180
    ) {
        return;
    }

    const roundCoordinate = (value: number) => Number(value.toFixed(6));
    const west = roundCoordinate(
        Math.max(-180, center.longitude - searchViewSpanDegrees),
    );
    const south = roundCoordinate(
        Math.max(-90, center.latitude - searchViewSpanDegrees),
    );
    const east = roundCoordinate(
        Math.min(180, center.longitude + searchViewSpanDegrees),
    );
    const north = roundCoordinate(
        Math.min(90, center.latitude + searchViewSpanDegrees),
    );

    url.searchParams.set("viewbox", `${west},${south},${east},${north}`);
}

async function requestPlaceQuery(
    query: string,
    countryCode: CountryCode,
    center?: PlaceSearchOptions["center"],
    signal?: AbortSignal,
) {
    const delayMs = Math.max(0, nextRequestAt - Date.now());
    await waitForTurn(delayMs, signal);
    nextRequestAt = Date.now() + minimumRequestIntervalMs;

    const url = new URL(nominatimSearchUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("countrycodes", countryCode.toLowerCase());
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("accept-language", "ko");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set("limit", String(maximumResultCount));
    addLocationBias(url, center);

    let response: Response;

    try {
        response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal,
        });
    } catch (error) {
        if (signal?.aborted) {
            throw error;
        }

        throw new PlaceSearchError(
            "request-failed",
            "장소 검색 서버에 연결하지 못했습니다.",
        );
    }

    if (response.status === 429) {
        throw new PlaceSearchError("rate-limit", "검색 요청이 잠시 많습니다.");
    }

    if (!response.ok) {
        throw new PlaceSearchError(
            "request-failed",
            "장소 검색 요청을 완료하지 못했습니다.",
        );
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch {
        throw new PlaceSearchError(
            "invalid-response",
            "장소 검색 응답을 읽지 못했습니다.",
        );
    }

    return parseNominatimSearchResults(payload);
}

function isJapaneseAddressQuery(query: string, countryCode: CountryCode) {
    return (
        countryCode === "JP" &&
        /\d/.test(query) &&
        /[都道府県市区町村郡丁目番地号]/.test(query)
    );
}

async function requestJapaneseAddress(
    query: string,
    signal?: AbortSignal,
    placeName?: string,
) {
    const url = new URL(gsiAddressSearchUrl);
    url.searchParams.set("q", query);

    let response: Response;

    try {
        response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal,
        });
    } catch (error) {
        if (signal?.aborted) {
            throw error;
        }

        return [];
    }

    if (!response.ok) {
        return [];
    }

    try {
        return parseGsiAddressSearchResults(await response.json(), placeName);
    } catch {
        return [];
    }
}

function mergeSearchResults(groups: readonly (readonly PlaceSearchResult[])[]) {
    const seenIds = new Set<string>();
    const results: PlaceSearchResult[] = [];

    for (const [groupIndex, group] of groups.entries()) {
        const priorGroupResultCount = results.length;

        for (const result of group) {
            if (seenIds.has(result.id)) {
                continue;
            }

            seenIds.add(result.id);

            if (groupIndex > 0) {
                const nearbyResultIndex = results
                    .slice(0, priorGroupResultCount)
                    .findIndex(
                        (candidate) =>
                            getDistanceInMeters(
                                candidate.coordinates,
                                result.coordinates,
                            ) <= 80,
                    );

                if (nearbyResultIndex >= 0) {
                    const nearbyResult = results[nearbyResultIndex];

                    results[nearbyResultIndex] = {
                        ...nearbyResult,
                        address: result.address,
                        coordinates: result.coordinates,
                    };
                    continue;
                }
            }

            results.push(result);

            if (results.length === maximumResultCount) {
                return results;
            }
        }
    }

    return results;
}

function getDistanceInMeters(
    left: PlaceSearchResult["coordinates"],
    right: PlaceSearchResult["coordinates"],
) {
    const degreesToRadians = Math.PI / 180;
    const latitudeDelta = (right.latitude - left.latitude) * degreesToRadians;
    const longitudeDelta =
        (right.longitude - left.longitude) * degreesToRadians;
    const leftLatitude = left.latitude * degreesToRadians;
    const rightLatitude = right.latitude * degreesToRadians;
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(leftLatitude) *
            Math.cos(rightLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;

    return 2 * 6_371_000 * Math.asin(Math.sqrt(haversine));
}

async function requestPlaces(
    query: string,
    countryCode: CountryCode,
    options: PlaceSearchOptions,
) {
    const queries = createPlaceSearchQueries(
        query,
        countryCode,
        options.region,
    );

    if (queries.length === 1) {
        if (isJapaneseAddressQuery(queries[0], countryCode)) {
            const japaneseAddressResults = await requestJapaneseAddress(
                queries[0],
                options.signal,
            );

            if (japaneseAddressResults.length > 0) {
                return japaneseAddressResults;
            }
        }

        return requestPlaceQuery(
            queries[0],
            countryCode,
            options.center,
            options.signal,
        );
    }

    const primaryGroups: PlaceSearchResult[][] = [];

    primaryGroups.push(
        await requestPlaceQuery(
            queries[0],
            countryCode,
            options.center,
            options.signal,
        ),
    );

    let addressResults: PlaceSearchResult[] = [];

    if (isJapaneseAddressQuery(queries[1], countryCode)) {
        const placeName = queries[0].split(",", 1)[0]?.trim();
        addressResults = await requestJapaneseAddress(
            queries[1],
            options.signal,
            placeName,
        );
    }

    if (addressResults.length === 0) {
        addressResults = await requestPlaceQuery(
            queries[1],
            countryCode,
            options.center,
            options.signal,
        );
    }

    primaryGroups.push(addressResults);
    const primaryResults = mergeSearchResults(primaryGroups);

    if (primaryResults.length > 0 || !queries[2]) {
        return primaryResults;
    }

    return requestPlaceQuery(
        queries[2],
        countryCode,
        options.center,
        options.signal,
    );
}

export function searchPlaces(
    query: string,
    countryCode: CountryCode,
    options: PlaceSearchOptions = {},
): Promise<PlaceSearchResult[]> {
    const normalizedQuery = normalizePlaceSearchQuery(query);
    const centerKey = options.center
        ? `${options.center.latitude.toFixed(4)},${options.center.longitude.toFixed(4)}`
        : "";
    const cacheKey = `${countryCode}:${options.region ?? ""}:${centerKey}:${normalizedQuery.toLocaleLowerCase("ko-KR")}`;
    const cachedResults = searchCache.get(cacheKey);

    if (cachedResults) {
        return Promise.resolve([...cachedResults]);
    }

    const queuedRequest = requestQueue.then(
        () => requestPlaces(normalizedQuery, countryCode, options),
        () => requestPlaces(normalizedQuery, countryCode, options),
    );

    requestQueue = queuedRequest.then(
        () => undefined,
        () => undefined,
    );

    return queuedRequest.then((results) => {
        searchCache.set(cacheKey, results);
        return [...results];
    });
}
