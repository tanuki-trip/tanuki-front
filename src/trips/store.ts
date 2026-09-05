import { create } from "zustand";

import type { CountryCode } from "./countries";
import { getTransportHub, type TransportHub } from "./transport-hubs";
import type { TransportType } from "./transport";

export type TripMember = {
    id: string;
    name: string;
};

export type Trip = {
    id: string;
    name: string;
    country: string;
    countryCode: CountryCode;
    currencyCode: string;
    startDate: string;
    endDate: string;
    members: TripMember[];
    transportType: TransportType;
    returnTransportType?: TransportType;
    arrivalHub?: TransportHub;
    departureHub?: TransportHub;
};

export type NewTrip = Omit<Trip, "id" | "members"> & {
    memberNames: string[];
};

type TripState = {
    trips: Trip[];
    addTrip: (trip: NewTrip) => string;
    renameTrip: (tripId: string, name: string) => void;
    removeTrip: (tripId: string) => void;
};

function createId(prefix: string) {
    return `${prefix}-${crypto.randomUUID()}`;
}

export const initialTrips: Trip[] = [
    {
        id: "japan-tokyo",
        name: "도쿄 4박 5일",
        country: "일본",
        countryCode: "JP",
        currencyCode: "JPY",
        startDate: "2026-10-08",
        endDate: "2026-10-12",
        members: [
            { id: "japan-member-owner", name: "나" },
            { id: "japan-member-1", name: "민지" },
        ],
        transportType: "flight",
        returnTransportType: "flight",
        arrivalHub: getTransportHub("jp-hnd"),
        departureHub: getTransportHub("jp-hnd"),
    },
    {
        id: "china-shanghai",
        name: "상하이 주말 여행",
        country: "중국",
        countryCode: "CN",
        currencyCode: "CNY",
        startDate: "2026-11-06",
        endDate: "2026-11-10",
        members: [
            { id: "china-member-owner", name: "나" },
            { id: "china-member-1", name: "서윤" },
            { id: "china-member-2", name: "지우" },
            { id: "china-member-3", name: "현수" },
        ],
        transportType: "flight",
        returnTransportType: "flight",
        arrivalHub: getTransportHub("cn-pvg"),
        departureHub: getTransportHub("cn-pvg"),
    },
    {
        id: "vietnam-danang",
        name: "다낭 가족 여행",
        country: "베트남",
        countryCode: "VN",
        currencyCode: "VND",
        startDate: "2027-01-14",
        endDate: "2027-01-19",
        members: [
            { id: "vietnam-member-owner", name: "나" },
            { id: "vietnam-member-1", name: "엄마" },
            { id: "vietnam-member-2", name: "아빠" },
        ],
        transportType: "flight",
        returnTransportType: "flight",
        arrivalHub: getTransportHub("vn-dad"),
        departureHub: getTransportHub("vn-dad"),
    },
    {
        id: "korea-jeju",
        name: "제주도 주말 여행",
        country: "한국",
        countryCode: "KR",
        currencyCode: "KRW",
        startDate: "2027-03-06",
        endDate: "2027-03-08",
        members: [
            { id: "korea-member-owner", name: "나" },
            { id: "korea-member-1", name: "소연" },
        ],
        transportType: "flight",
        returnTransportType: "flight",
        arrivalHub: getTransportHub("kr-cju"),
        departureHub: getTransportHub("kr-cju"),
    },
];

export const useTripStore = create<TripState>()((set) => ({
    trips: initialTrips,
    addTrip: (newTrip) => {
        const { memberNames, ...trip } = newTrip;
        const tripId = createId("trip");
        const members = memberNames.map((name) => ({
            id: createId("member"),
            name,
        }));

        set((state) => ({
            trips: [{ ...trip, id: tripId, members }, ...state.trips],
        }));

        return tripId;
    },
    renameTrip: (tripId, name) =>
        set((state) => ({
            trips: state.trips.map((trip) =>
                trip.id === tripId ? { ...trip, name } : trip,
            ),
        })),
    removeTrip: (tripId) =>
        set((state) => ({
            trips: state.trips.filter((trip) => trip.id !== tripId),
        })),
}));
