import { useEffect, useRef } from "react";
import { matchPath, useLocation } from "react-router-dom";

import { useAuthStore } from "../../auth/store";
import {
    prewarmTripMapResources,
    resolveTripMapStyleUrl,
} from "../../pages/trip/components/trip-map-loader";
import { getStoredTripMapStyle } from "../../trips/map-style";

const preloadDelayMs = 150;

export function TripMapPreloader() {
    const { pathname } = useLocation();
    const authStatus = useAuthStore((state) => state.status);
    const requestedPreloadRef = useRef<string | null>(null);

    useEffect(() => {
        if (authStatus === "guest") {
            return;
        }

        const match = matchPath({ path: "/trip/:tripId", end: true }, pathname);
        const tripId = match?.params.tripId;

        if (!tripId) {
            return;
        }

        const mapStyleUrl = resolveTripMapStyleUrl(
            getStoredTripMapStyle(tripId),
        );
        const preloadKey = `${tripId}:${mapStyleUrl}`;

        if (requestedPreloadRef.current === preloadKey) {
            return;
        }

        requestedPreloadRef.current = preloadKey;
        let preloadStarted = false;
        const timer = window.setTimeout(() => {
            preloadStarted = true;
            void prewarmTripMapResources(mapStyleUrl).catch(() => undefined);
        }, preloadDelayMs);

        return () => {
            window.clearTimeout(timer);

            if (!preloadStarted && requestedPreloadRef.current === preloadKey) {
                requestedPreloadRef.current = null;
            }
        };
    }, [authStatus, pathname]);

    return null;
}
