import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TripPlace } from "../../../places/model";
import type { PlaceSearchResult } from "../../../places/search";
import { TripMap } from "./TripMap";

const mapMocks = vi.hoisted(() => ({
    addControl: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    container: null as HTMLElement | null,
    easeTo: vi.fn(),
    layerIds: new Set<string>(),
    markerElements: [] as HTMLElement[],
    markerPositions: [] as [number, number][],
    mapStyles: [] as unknown[],
    popupContents: [] as HTMLElement[],
    popupPositions: [] as [number, number][],
    popupRemove: vi.fn(),
    remove: vi.fn(),
    routeSource: { setData: vi.fn() },
    sourceAdded: false,
}));

vi.mock("maplibre-gl", () => {
    class MockMap {
        constructor({
            container,
            style,
        }: {
            container: HTMLElement;
            style: unknown;
        }) {
            mapMocks.container = container;
            mapMocks.mapStyles.push(style);
        }

        addControl(...parameters: unknown[]) {
            mapMocks.addControl(...parameters);
        }

        addLayer(layer: { id: string }, beforeId?: string) {
            mapMocks.layerIds.add(layer.id);
            mapMocks.addLayer(layer, beforeId);
        }

        addSource(sourceId: string, source: unknown) {
            mapMocks.sourceAdded = sourceId === "trip-place-route";
            mapMocks.addSource(sourceId, source);
        }

        easeTo(options: unknown) {
            mapMocks.easeTo(options);
        }

        getLayer(layerId: string) {
            return mapMocks.layerIds.has(layerId) ? { id: layerId } : undefined;
        }

        getSource(sourceId: string) {
            return sourceId === "trip-place-route" && mapMocks.sourceAdded
                ? mapMocks.routeSource
                : undefined;
        }

        getStyle() {
            return { layers: [{ id: "place-labels", type: "symbol" }] };
        }

        once(_event: string, callback: () => void) {
            callback();
        }

        remove() {
            mapMocks.remove();
        }
    }

    class MockMarker {
        private readonly element: HTMLElement;
        private positioned = false;

        constructor({ element }: { element: HTMLElement }) {
            this.element = element;
            mapMocks.markerElements.push(element);
        }

        addTo() {
            if (!this.positioned) {
                throw new Error("Marker needs a position before addTo");
            }

            mapMocks.container?.append(this.element);
            return this;
        }

        remove() {
            this.element.remove();
        }

        setLngLat(position: [number, number]) {
            this.positioned = true;
            mapMocks.markerPositions.push(position);
            return this;
        }
    }

    class MockNavigationControl {}

    class MockPopup {
        private content: HTMLElement | null = null;

        addTo() {
            if (!this.content) {
                throw new Error("Popup content is required before addTo");
            }

            mapMocks.container?.append(this.content);
            return this;
        }

        remove() {
            this.content?.remove();
            mapMocks.popupRemove();
        }

        setDOMContent(content: HTMLElement) {
            this.content = content;
            mapMocks.popupContents.push(content);
            return this;
        }

        setLngLat(position: [number, number]) {
            mapMocks.popupPositions.push(position);
            return this;
        }
    }

    return {
        Map: MockMap,
        Marker: MockMarker,
        NavigationControl: MockNavigationControl,
        Popup: MockPopup,
    };
});

const places: TripPlace[] = [
    {
        id: "place-1",
        name: "센소지",
        address: "2-3-1 Asakusa, Taito City",
        coordinates: { latitude: 35.7148, longitude: 139.7967 },
        day: 1,
        order: 0,
        arrivalTime: "09:00",
        memo: null,
        placeCost: { amount: 500, currency: "JPY" },
        inbound: {
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        },
        fixedPosition: null,
    },
    {
        id: "place-2",
        name: "호텔 니혼바시",
        address: "2 Chome Nihonbashi, Chuo City",
        coordinates: { latitude: 35.683, longitude: 139.773 },
        day: 1,
        order: 1,
        arrivalTime: "19:00",
        memo: null,
        placeCost: { amount: 12_000, currency: "JPY" },
        inbound: {
            mode: "subway",
            durationMin: 24,
            cost: { amount: 180, currency: "JPY" },
            isPassCovered: false,
        },
        fixedPosition: null,
    },
];

const searchPlace: PlaceSearchResult = {
    id: "way-173154847",
    name: "검색한 센소지",
    address: "다이토구, 도쿄도, 일본",
    coordinates: { latitude: 35.7134, longitude: 139.7955 },
};

describe("TripMap", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mapMocks.container = null;
        mapMocks.layerIds = new Set();
        mapMocks.markerElements = [];
        mapMocks.markerPositions = [];
        mapMocks.mapStyles = [];
        mapMocks.popupContents = [];
        mapMocks.popupPositions = [];
        mapMocks.sourceAdded = false;
        Object.defineProperty(window, "WebGLRenderingContext", {
            configurable: true,
            value: class WebGLRenderingContext {},
        });
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: vi.fn(
                (query: string) =>
                    ({
                        matches: query === "(min-width: 920px)",
                    }) as MediaQueryList,
            ),
        });
    });

    it("renders numbered place markers and focuses the selected place", async () => {
        const onPlaceSelect = vi.fn();
        const unsortedPlaces = [...places].reverse();
        const { rerender } = render(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={1}
                focusedPlaceId="place-1"
                mapStyleId="positron"
                onPlaceSelect={onPlaceSelect}
                places={unsortedPlaces}
            />,
        );

        const firstMarker = await screen.findByRole("button", {
            name: "지도에서 센소지 보기",
        });
        const secondMarker = screen.getByRole("button", {
            name: "지도에서 호텔 니혼바시 보기",
        });

        expect(firstMarker).toHaveTextContent("1");
        expect(secondMarker).toHaveTextContent("2");
        expect(mapMocks.markerPositions).toContainEqual([139.7967, 35.7148]);
        expect(mapMocks.markerPositions).toContainEqual([139.773, 35.683]);
        expect(mapMocks.addSource).toHaveBeenCalledWith(
            "trip-place-route",
            expect.objectContaining({
                data: expect.objectContaining({
                    features: [
                        expect.objectContaining({
                            geometry: {
                                type: "LineString",
                                coordinates: [
                                    [139.7967, 35.7148],
                                    [139.773, 35.683],
                                ],
                            },
                        }),
                    ],
                }),
                type: "geojson",
            }),
        );
        expect(mapMocks.addLayer).toHaveBeenCalledTimes(2);
        expect(mapMocks.addLayer).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                id: "trip-place-route-line",
                paint: expect.objectContaining({
                    "line-color": "#000000",
                    "line-dasharray": [2, 1.5],
                }),
            }),
            "place-labels",
        );
        await waitFor(() => {
            expect(mapMocks.easeTo).toHaveBeenCalledWith(
                expect.objectContaining({
                    center: [139.7967, 35.7148],
                    duration: 700,
                    offset: [0, 0],
                    zoom: 15,
                }),
            );
            expect(firstMarker).toHaveAttribute("aria-pressed", "true");
        });

        fireEvent.click(secondMarker);
        expect(onPlaceSelect).toHaveBeenCalledWith("place-2");

        rerender(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={2}
                focusedPlaceId="place-2"
                mapStyleId="positron"
                onPlaceSelect={onPlaceSelect}
                places={unsortedPlaces}
            />,
        );

        await waitFor(() => {
            expect(mapMocks.easeTo).toHaveBeenCalledWith(
                expect.objectContaining({
                    center: [139.773, 35.683],
                    duration: 700,
                    offset: [0, 0],
                    zoom: 15,
                }),
            );
            expect(secondMarker).toHaveAttribute("aria-pressed", "true");
        });
    });

    it("does not draw a route for unordered bookmarked places", async () => {
        const bookmarks = places.map((place) => ({
            ...place,
            day: "bookmark" as const,
            order: null,
        }));

        render(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={0}
                focusedPlaceId={null}
                mapStyleId="positron"
                onPlaceSelect={vi.fn()}
                places={bookmarks}
            />,
        );

        await waitFor(() => {
            expect(mapMocks.addSource).toHaveBeenCalledWith(
                "trip-place-route",
                expect.objectContaining({
                    data: {
                        type: "FeatureCollection",
                        features: [],
                    },
                }),
            );
        });
    });

    it("opens directions without zooming again when a focused marker is activated", async () => {
        const onPlaceSelect = vi.fn();

        const { rerender } = render(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={0}
                focusedPlaceId={null}
                mapStyleId="positron"
                onPlaceSelect={onPlaceSelect}
                places={places}
            />,
        );

        const firstMarker = await screen.findByRole("button", {
            name: "지도에서 센소지 보기",
        });
        const secondMarker = screen.getByRole("button", {
            name: "지도에서 호텔 니혼바시 보기",
        });

        fireEvent.click(secondMarker);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        rerender(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={1}
                focusedPlaceId="place-2"
                mapStyleId="positron"
                onPlaceSelect={onPlaceSelect}
                places={places}
            />,
        );
        await waitFor(() => {
            expect(secondMarker).toHaveAttribute("aria-pressed", "true");
        });

        fireEvent.click(secondMarker);
        const popup = screen.getByRole("dialog", {
            name: "호텔 니혼바시 이동 경로",
        });
        const currentLocationLink = screen.getByRole("link", {
            name: "현재 위치에서 이동",
        });
        const previousLocationLink = screen.getByRole("link", {
            name: "이전 위치에서 이동",
        });

        expect(popup).toBeVisible();
        expect(currentLocationLink).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=35.683%2C139.773",
        );
        expect(previousLocationLink).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=35.683%2C139.773&origin=35.7148%2C139.7967",
        );
        expect(currentLocationLink).toHaveAttribute("target", "_blank");
        expect(currentLocationLink).toHaveAttribute(
            "rel",
            "noopener noreferrer",
        );
        expect(mapMocks.popupPositions).toContainEqual([139.773, 35.683]);
        expect(onPlaceSelect).toHaveBeenCalledTimes(1);
        expect(mapMocks.easeTo).toHaveBeenCalledTimes(1);

        fireEvent.click(firstMarker);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        rerender(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={3}
                focusedPlaceId="place-1"
                mapStyleId="positron"
                onPlaceSelect={onPlaceSelect}
                places={places}
            />,
        );
        await waitFor(() => {
            expect(firstMarker).toHaveAttribute("aria-pressed", "true");
        });
        fireEvent.click(firstMarker);
        expect(
            screen.getByRole("dialog", { name: "센소지 이동 경로" }),
        ).toBeVisible();
        expect(
            screen.queryByRole("link", { name: "이전 위치에서 이동" }),
        ).not.toBeInTheDocument();
        expect(onPlaceSelect).toHaveBeenCalledTimes(2);
        expect(mapMocks.easeTo).toHaveBeenCalledTimes(2);
    });

    it("renders a selected search result and moves the map to it", async () => {
        render(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={1}
                focusedPlaceId={null}
                mapStyleId="positron"
                onPlaceSelect={vi.fn()}
                places={places}
                searchPlace={searchPlace}
            />,
        );

        expect(
            await screen.findByRole("img", {
                name: "검색한 센소지 검색 위치",
            }),
        ).toBeInTheDocument();
        expect(mapMocks.markerPositions).toContainEqual([139.7955, 35.7134]);

        await waitFor(() => {
            expect(mapMocks.easeTo).toHaveBeenCalledWith(
                expect.objectContaining({
                    center: [139.7955, 35.7134],
                    duration: 700,
                    zoom: 15,
                }),
            );
        });
    });

    it("reloads the map when its saved style changes", async () => {
        const { rerender } = render(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={0}
                focusedPlaceId={null}
                mapStyleId="positron"
                onPlaceSelect={vi.fn()}
                places={places}
            />,
        );

        await waitFor(() => {
            expect(mapMocks.mapStyles).toEqual([
                "https://tiles.openfreemap.org/styles/positron",
            ]);
        });

        rerender(
            <TripMap
                countryCode="JP"
                countryName="일본"
                focusRequest={0}
                focusedPlaceId={null}
                mapStyleId="dark"
                onPlaceSelect={vi.fn()}
                places={places}
            />,
        );

        await waitFor(() => {
            expect(mapMocks.mapStyles).toEqual([
                "https://tiles.openfreemap.org/styles/positron",
                "https://tiles.openfreemap.org/styles/dark",
            ]);
            expect(mapMocks.remove).toHaveBeenCalledTimes(1);
        });
    });
});
