import japanCover from "../../assets/trip-covers/japan.webp";
import koreaCover from "../../assets/trip-covers/korea.webp";
import type { CountryCode } from "../../trips/countries";
import type { Trip } from "../../trips/store";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const tripCoverByCountry: Record<CountryCode, string> = {
    JP: japanCover,
    KR: koreaCover,
};

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

function dateToUtcTimestamp(date: string) {
    const [year, month, day] = date.split("-").map(Number);

    return Date.UTC(year, month - 1, day);
}

export function getDaysUntilTrip(startDate: string, today = new Date()) {
    const todayTimestamp = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    return Math.round(
        (dateToUtcTimestamp(startDate) - todayTimestamp) / MILLISECONDS_PER_DAY,
    );
}

export function getTripSections<T extends Pick<Trip, "id" | "startDate">>(
    trips: T[],
    today = new Date(),
) {
    const sortedTrips = [...trips].sort((left, right) =>
        left.startDate.localeCompare(right.startDate),
    );
    const upcomingTrip = sortedTrips.find(
        (trip) => getDaysUntilTrip(trip.startDate, today) >= 0,
    );

    return {
        upcomingTrip,
        otherTrips: upcomingTrip
            ? sortedTrips.filter((trip) => trip.id !== upcomingTrip.id)
            : sortedTrips,
    };
}
