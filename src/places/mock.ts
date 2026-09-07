import type { TripPlace } from "./model";
import {
    yokohamaShirakawagoTokyoPlaceSeeds,
    type TripPlaceSeed,
} from "./yokohama-shirakawago-tokyo";

const mockPlacesByTripId: Record<string, readonly TripPlaceSeed[]> = {
    "japan-yokohama-shirakawago-tokyo": yokohamaShirakawagoTokyoPlaceSeeds,
    "japan-tokyo": [
        {
            day: 1,
            name: "센소지",
            address: "2-3-1 Asakusa, Taito City",
            coordinates: { latitude: 35.7148, longitude: 139.7967 },
            arrivalTime: "10:30",
            category: "tourism",
            placeCost: 500,
            inbound: { mode: "train", durationMin: 45, cost: 520 },
        },
        {
            day: 1,
            name: "쓰키지 장외시장",
            address: "4 Chome Tsukiji, Chuo City",
            coordinates: { latitude: 35.6655, longitude: 139.7708 },
            arrivalTime: "13:00",
            category: "food",
            placeCost: 3_000,
            inbound: { mode: "subway", durationMin: 28, cost: 210 },
        },
        {
            day: 1,
            name: "돈키호테 시부야점",
            address: "28-6 Udagawacho, Shibuya City",
            coordinates: { latitude: 35.6606, longitude: 139.6988 },
            arrivalTime: "17:30",
            category: "other",
            placeCost: 4_500,
            inbound: { mode: "subway", durationMin: 24, cost: 180 },
        },
    ],
    "korea-jeju": [
        {
            day: 1,
            name: "제주 동문시장",
            address: "제주특별자치도 제주시 관덕로14길 20",
            coordinates: { latitude: 33.5116, longitude: 126.526 },
            arrivalTime: "10:30",
            category: "food",
            placeCost: 18_000,
            inbound: { mode: "bus", durationMin: 25, cost: 1_500 },
        },
        {
            day: 1,
            name: "성산일출봉",
            address: "제주특별자치도 서귀포시 성산읍 일출로 284-12",
            coordinates: { latitude: 33.4581, longitude: 126.9425 },
            arrivalTime: "14:00",
            category: "tourism",
            placeCost: 5_000,
            inbound: { mode: "car", durationMin: 65, cost: 12_000 },
        },
        {
            day: 1,
            name: "오설록 티뮤지엄",
            address: "제주특별자치도 서귀포시 안덕면 신화역사로 15",
            coordinates: { latitude: 33.3059, longitude: 126.2894 },
            arrivalTime: "17:00",
            category: "other",
            placeCost: 12_000,
            inbound: { mode: "car", durationMin: 70, cost: 15_000 },
        },
    ],
};

export function createMockTripPlaces({
    currencyCode,
    tripId,
}: {
    currencyCode: string;
    tripId: string;
}): TripPlace[] {
    const nextOrderByDay = new Map<number, number>();

    return (mockPlacesByTripId[tripId] ?? []).map((seed, index) => {
        const order = (nextOrderByDay.get(seed.day) ?? 0) + 1;
        nextOrderByDay.set(seed.day, order);

        return {
            id: `mock-${tripId}-${index + 1}`,
            name: seed.name,
            address: seed.address,
            coordinates: seed.coordinates,
            day: seed.day,
            order,
            arrivalTime: seed.arrivalTime,
            memo: seed.memo ?? null,
            placeCost: {
                amount: seed.placeCost,
                currency: currencyCode,
                category: seed.category,
            },
            inbound: {
                mode: seed.inbound.mode,
                durationMin: seed.inbound.durationMin,
                cost:
                    seed.inbound.cost === null
                        ? null
                        : {
                              amount: seed.inbound.cost,
                              currency: currencyCode,
                          },
                isPassCovered: seed.inbound.isPassCovered ?? false,
            },
            fixedPosition: null,
        } satisfies TripPlace;
    });
}
