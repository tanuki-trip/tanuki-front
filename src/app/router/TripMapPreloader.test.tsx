import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../../auth/store";

import { TripMapPreloader } from "./TripMapPreloader";

const mapLoaderMocks = vi.hoisted(() => ({
    prewarmTripMapResources: vi.fn().mockResolvedValue(undefined),
    resolveTripMapStyleUrl: vi.fn(
        (mapStyleId: string) => `https://maps.test/styles/${mapStyleId}`,
    ),
}));

vi.mock("../../pages/trip/components/trip-map-loader", () => mapLoaderMocks);

const initialAuthState = useAuthStore.getState();

function renderPreloader(pathname: string) {
    return render(
        <StrictMode>
            <MemoryRouter initialEntries={[pathname]}>
                <TripMapPreloader />
            </MemoryRouter>
        </StrictMode>,
    );
}

describe("TripMapPreloader", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
        useAuthStore.setState(initialAuthState, true);
    });

    it("prewarms the saved map style while trip authentication is checked", async () => {
        useAuthStore.setState({ status: "checking", user: null });
        window.localStorage.setItem(
            "tanuki:trip-map-style:v1:japan-tokyo",
            "dark",
        );

        renderPreloader("/trip/japan-tokyo");
        await act(() => vi.advanceTimersByTimeAsync(149));

        expect(mapLoaderMocks.prewarmTripMapResources).not.toHaveBeenCalled();

        await act(() => vi.advanceTimersByTimeAsync(1));

        expect(mapLoaderMocks.resolveTripMapStyleUrl).toHaveBeenCalledWith(
            "dark",
        );
        expect(
            mapLoaderMocks.prewarmTripMapResources,
        ).toHaveBeenCalledExactlyOnceWith("https://maps.test/styles/dark");
    });

    it.each([
        ["guest", "/trip/japan-tokyo"],
        ["checking", "/trips/new"],
    ] as const)(
        "does not preload for %s at %s",
        async (authStatus, pathname) => {
            useAuthStore.setState({ status: authStatus, user: null });

            renderPreloader(pathname);
            await act(() => vi.runAllTimersAsync());

            expect(
                mapLoaderMocks.prewarmTripMapResources,
            ).not.toHaveBeenCalled();
        },
    );
});
