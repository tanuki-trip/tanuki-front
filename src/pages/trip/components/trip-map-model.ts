import { compareTripPlaceOrder, type TripPlace } from "../../../places/model";
import type { CountryCode } from "../../../trips/countries";

type CountryView = {
    center: [longitude: number, latitude: number];
    zoom: number;
};

type MapCoordinates = TripPlace["coordinates"];

export type InitialMapView =
    | {
          kind: "camera";
          center: [longitude: number, latitude: number];
          zoom: number;
      }
    | {
          kind: "bounds";
          bounds: [
              [west: number, south: number],
              [east: number, north: number],
          ];
          padding: number;
          maxZoom: number;
      };

export const routeSourceId = "trip-place-route";
export const routeCasingLayerId = "trip-place-route-casing";
export const routeLayerId = "trip-place-route-line";

export const countryViews: Record<CountryCode, CountryView> = {
    KR: { center: [127.8, 36.3], zoom: 5.4 },
    JP: { center: [138.1, 36.2], zoom: 4.8 },
};

function isValidCoordinates(
    coordinates: MapCoordinates | undefined,
): coordinates is MapCoordinates {
    return (
        coordinates !== undefined &&
        Number.isFinite(coordinates.latitude) &&
        Number.isFinite(coordinates.longitude) &&
        coordinates.latitude >= -90 &&
        coordinates.latitude <= 90 &&
        coordinates.longitude >= -180 &&
        coordinates.longitude <= 180
    );
}

export function getInitialMapView(
    countryCode: CountryCode,
    places: readonly TripPlace[],
    fallbackCoordinates?: MapCoordinates,
    preferredCoordinates?: MapCoordinates,
): InitialMapView {
    if (isValidCoordinates(preferredCoordinates)) {
        return {
            kind: "camera",
            center: [
                preferredCoordinates.longitude,
                preferredCoordinates.latitude,
            ],
            zoom: 15,
        };
    }

    const coordinates = places
        .map((place) => place.coordinates)
        .filter(isValidCoordinates);

    if (coordinates.length === 0) {
        if (isValidCoordinates(fallbackCoordinates)) {
            return {
                kind: "camera",
                center: [
                    fallbackCoordinates.longitude,
                    fallbackCoordinates.latitude,
                ],
                zoom: 11,
            };
        }

        return { kind: "camera", ...countryViews[countryCode] };
    }

    if (coordinates.length === 1) {
        return {
            kind: "camera",
            center: [coordinates[0].longitude, coordinates[0].latitude],
            zoom: 14,
        };
    }

    const longitudes = coordinates.map(({ longitude }) => longitude);
    const latitudes = coordinates.map(({ latitude }) => latitude);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);

    if (west === east && south === north) {
        return {
            kind: "camera",
            center: [west, south],
            zoom: 14,
        };
    }

    return {
        kind: "bounds",
        bounds: [
            [west, south],
            [east, north],
        ],
        padding: 64,
        maxZoom: 14,
    };
}

export function createRouteData(places: readonly TripPlace[]) {
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
