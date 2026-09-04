import chinaCover from "../../assets/trip-covers/china.webp";
import japanCover from "../../assets/trip-covers/japan.webp";
import vietnamCover from "../../assets/trip-covers/vietnam.webp";
import type { CountryCode } from "../../trips/countries";

const tripCoverByCountry: Record<CountryCode, string> = {
    CN: chinaCover,
    JP: japanCover,
    VN: vietnamCover,
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
