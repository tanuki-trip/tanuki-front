import chinaCover from "../../assets/trip-covers/china.webp";
import japanCover from "../../assets/trip-covers/japan.webp";
import vietnamCover from "../../assets/trip-covers/vietnam.webp";
import type { CountryCode } from "./components/CountryFlag";

export type Trip = {
    id: string;
    name: string;
    country: string;
    countryCode: CountryCode;
    startDate: string;
    endDate: string;
    memberCount: number;
};

const tripCoverByCountry: Record<CountryCode, string> = {
    CN: chinaCover,
    JP: japanCover,
    VN: vietnamCover,
};

export const mockTrips: Trip[] = [
    {
        id: "japan-tokyo",
        name: "도쿄 4박 5일",
        country: "일본",
        countryCode: "JP",
        startDate: "2026-10-08",
        endDate: "2026-10-12",
        memberCount: 2,
    },
    {
        id: "china-shanghai",
        name: "상하이 주말 여행",
        country: "중국",
        countryCode: "CN",
        startDate: "2026-11-06",
        endDate: "2026-11-10",
        memberCount: 4,
    },
    {
        id: "vietnam-danang",
        name: "다낭 가족 여행",
        country: "베트남",
        countryCode: "VN",
        startDate: "2027-01-14",
        endDate: "2027-01-19",
        memberCount: 3,
    },
];

export function getTripCover(countryCode: CountryCode) {
    return tripCoverByCountry[countryCode];
}

export function formatCompactStartDate(date: string) {
    const [year, month, day] = date.split("-");

    return `${year.slice(-2)}.${month}.${day}`;
}

export function formatCompactEndDate(startDate: string, endDate: string) {
    const [startYear, startMonth] = startDate.split("-");
    const [endYear, endMonth, endDay] = endDate.split("-");

    if (startYear !== endYear) {
        return `${endYear.slice(-2)}.${endMonth}.${endDay}`;
    }

    if (startMonth !== endMonth) {
        return `${endMonth}.${endDay}`;
    }

    return endDay;
}
