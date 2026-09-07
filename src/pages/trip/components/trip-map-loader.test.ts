import { afterEach, describe, expect, it, vi } from "vitest";

import {
    loadTripMapResources,
    prewarmTripMapResources,
} from "./trip-map-loader";

vi.mock("maplibre-gl", () => ({
    Map: class MockMap {},
}));

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("trip map resource loader", () => {
    it("reuses a successfully prewarmed style when the map mounts", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
            ok: true,
            status: 200,
        });
        vi.stubGlobal("fetch", fetchMock);
        const mapStyleUrl = "https://maps.test/styles/positron";

        await prewarmTripMapResources(mapStyleUrl);
        await loadTripMapResources(mapStyleUrl, new AbortController().signal);

        expect(fetchMock).toHaveBeenCalledExactlyOnceWith(mapStyleUrl, {
            signal: undefined,
        });
    });
});
