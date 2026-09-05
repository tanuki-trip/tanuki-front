import { compareTripPlaceOrder, type TripPlace } from "../../../places/model";
import type { CountryCode } from "../../../trips/countries";

type CountryView = {
    center: [longitude: number, latitude: number];
    zoom: number;
};

export const defaultMapStyleUrl =
    "https://tiles.openfreemap.org/styles/positron";
export const routeSourceId = "trip-place-route";
export const routeCasingLayerId = "trip-place-route-casing";
export const routeLayerId = "trip-place-route-line";

export const countryViews: Record<CountryCode, CountryView> = {
    KR: { center: [127.8, 36.3], zoom: 5.4 },
    JP: { center: [138.1, 36.2], zoom: 4.8 },
    VN: { center: [108.2, 16.1], zoom: 4.7 },
    CN: { center: [104.2, 35.9], zoom: 3.4 },
    TH: { center: [101, 15.5], zoom: 4.6 },
    US: { center: [-98.5, 39.8], zoom: 3.2 },
};

export function createRouteData(places: TripPlace[]) {
    const coordinates = places
        .filter((place) => place.order !== null)
        .sort(compareTripPlaceOrder)
        .map((place) => [
            place.coordinates.longitude,
            place.coordinates.latitude,
        ]);

    return {
        type: "FeatureCollection" as const,
        features:
            coordinates.length >= 2
                ? [
                      {
                          type: "Feature" as const,
                          properties: {},
                          geometry: {
                              type: "LineString" as const,
                              coordinates,
                          },
                      },
                  ]
                : [],
    };
}
