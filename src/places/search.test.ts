import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createPlaceSearchQueries,
    normalizePlaceSearchQuery,
    parseGsiAddressSearchResults,
    parseNominatimSearchResults,
    searchPlaces,
} from "./search";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("parseNominatimSearchResults", () => {
    it("normalizes valid places and ignores malformed or duplicate results", () => {
        expect(
            parseNominatimSearchResults([
                {
                    place_id: 1,
                    osm_type: "way",
                    osm_id: 173154847,
                    lat: "35.7134032",
                    lon: "139.7955265",
                    name: "센소지",
                    display_name: "센소지, 다이토구, 도쿄도, 일본",
                },
                {
                    place_id: 2,
                    osm_type: "way",
                    osm_id: 173154847,
                    lat: "35.7134032",
                    lon: "139.7955265",
                    name: "센소지 중복",
                    display_name: "센소지 중복, 일본",
                },
                { place_id: 3, lat: "invalid", lon: "139.7" },
            ]),
        ).toEqual([
            {
                id: "way-173154847",
                name: "센소지",
                address: "다이토구, 도쿄도, 일본",
                coordinates: {
                    latitude: 35.7134032,
                    longitude: 139.7955265,
                },
            },
        ]);
    });
});

describe("parseGsiAddressSearchResults", () => {
    it("uses a separated building name with the official address pin", () => {
        expect(
            parseGsiAddressSearchResults(
                [
                    {
                        geometry: {
                            coordinates: [139.771378, 35.704941],
                            type: "Point",
                        },
                        properties: {
                            title: "東京都千代田区外神田六丁目16番3号",
                        },
                        type: "Feature",
                    },
                ],
                "国際6163ビル",
            ),
        ).toEqual([
            {
                id: "gsi-35.704941-139.771378",
                name: "国際6163ビル",
                address: "東京都千代田区外神田六丁目16番3号",
                coordinates: {
                    latitude: 35.704941,
                    longitude: 139.771378,
                },
            },
        ]);
    });
});

describe("searchPlaces", () => {
    it("searches only within the trip country and caches repeated queries", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue([
                {
                    place_id: 1,
                    osm_type: "way",
                    osm_id: 173154847,
                    lat: "35.7134032",
                    lon: "139.7955265",
                    name: "센소지",
                    display_name: "센소지, 다이토구, 도쿄도, 일본",
                },
            ]),
        });
        vi.stubGlobal("fetch", fetchMock);

        const searchOptions = {
            center: { latitude: 35.5494, longitude: 139.7798 },
            region: "도쿄",
        };
        const firstResults = await searchPlaces(
            "  센소지  ",
            "JP",
            searchOptions,
        );
        const cachedResults = await searchPlaces("센소지", "JP", searchOptions);
        const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));

        expect(firstResults).toEqual(cachedResults);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(requestUrl.origin + requestUrl.pathname).toBe(
            "https://nominatim.openstreetmap.org/search",
        );
        expect(requestUrl.searchParams.get("q")).toBe("센소지");
        expect(requestUrl.searchParams.get("countrycodes")).toBe("jp");
        expect(requestUrl.searchParams.get("accept-language")).toBe("ko");
        expect(requestUrl.searchParams.get("limit")).toBe("10");
        expect(requestUrl.searchParams.get("viewbox")).toBe(
            "138.9798,34.7494,140.5798,36.3494",
        );
    });

    it("searches separated place and address candidates around the trip region", async () => {
        const fetchMock = vi.fn().mockImplementation(async (input: URL) => {
            const requestUrl = new URL(String(input));
            const payload =
                requestUrl.hostname === "msearch.gsi.go.jp"
                    ? [
                          {
                              geometry: {
                                  coordinates: [139.771378, 35.704941],
                                  type: "Point",
                              },
                              properties: {
                                  title: "東京都千代田区外神田六丁目16番3号",
                              },
                              type: "Feature",
                          },
                      ]
                    : [];

            return {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue(payload),
            };
        });
        vi.stubGlobal("fetch", fetchMock);

        const results = await searchPlaces(
            "東京都千代田区外神田6-16-3 国際6163ビル 402",
            "JP",
            {
                center: { latitude: 35.5494, longitude: 139.7798 },
                region: "도쿄",
            },
        );
        const requestedQueries = fetchMock.mock.calls.map(([input]) =>
            new URL(String(input)).searchParams.get("q"),
        );

        expect(requestedQueries).toEqual([
            "国際6163ビル, 도쿄",
            "東京都千代田区外神田6-16-3",
        ]);
        expect(results.map(({ name }) => name)).toEqual(["国際6163ビル"]);
        expect(results[0]?.address).toBe("東京都千代田区外神田六丁目16番3号");
    });

    it("merges nearby place and address candidates into one result", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue([
                    {
                        osm_type: "way",
                        osm_id: 6163,
                        lat: "35.7048",
                        lon: "139.7712",
                        name: "国際6163ビル",
                        display_name:
                            "国際6163ビル, 外神田六丁目, 千代田区, 東京都, 日本",
                    },
                ]),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue([
                    {
                        geometry: {
                            coordinates: [139.771378, 35.704941],
                            type: "Point",
                        },
                        properties: {
                            title: "東京都千代田区外神田六丁目16番3号",
                        },
                        type: "Feature",
                    },
                ]),
            });
        vi.stubGlobal("fetch", fetchMock);

        const results = await searchPlaces(
            "東京都千代田区外神田6-16-3 国際6163ビル 403",
            "JP",
            {
                center: { latitude: 35.5494, longitude: 139.7798 },
                region: "도쿄",
            },
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(results).toEqual([
            {
                id: "way-6163",
                name: "国際6163ビル",
                address: "東京都千代田区外神田六丁目16番3号",
                coordinates: {
                    latitude: 35.704941,
                    longitude: 139.771378,
                },
            },
        ]);
    });

    it("normalizes romanized addresses without guessing a looser match", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue([]),
        });
        vi.stubGlobal("fetch", fetchMock);

        const results = await searchPlaces(
            "Tokyo, Chiyoda City, Sotokanda, 6-chōme−16−3",
            "JP",
        );
        const firstRequestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(firstRequestUrl.searchParams.get("q")).toBe(
            "Tokyo, Chiyoda City, Sotokanda, 6-chome-16-3",
        );
        expect(results).toEqual([]);
    });
});

describe("normalizePlaceSearchQuery", () => {
    it("normalizes diacritics, unicode dashes, and spacing", () => {
        expect(
            normalizePlaceSearchQuery(
                "  Tokyo, Chiyoda City, Sotokanda, 6-chōme − 16 − 3  ",
            ),
        ).toBe("Tokyo, Chiyoda City, Sotokanda, 6-chome-16-3");
    });

    it("preserves native-language diacritics", () => {
        expect(
            normalizePlaceSearchQuery("1 Tràng Tiền, Hoàn Kiếm, Hà Nội"),
        ).toBe("1 Tràng Tiền, Hoàn Kiếm, Hà Nội");
    });
});

describe("createPlaceSearchQueries", () => {
    it("removes a unit and separates a Japanese address from its building", () => {
        expect(
            createPlaceSearchQueries(
                "東京都千代田区外神田6-16-3 国際6163ビル 402",
                "JP",
                "도쿄",
            ),
        ).toEqual([
            "国際6163ビル, 도쿄",
            "東京都千代田区外神田6-16-3",
            "東京都千代田区外神田6-16-3 国際6163ビル",
        ]);
    });

    it("keeps an address-only query intact", () => {
        expect(
            createPlaceSearchQueries(
                "Tokyo, Chiyoda City, Sotokanda, 6-chōme−16−3",
                "JP",
                "도쿄",
            ),
        ).toEqual(["Tokyo, Chiyoda City, Sotokanda, 6-chome-16-3"]);
    });
});
