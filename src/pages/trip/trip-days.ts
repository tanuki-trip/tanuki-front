const millisecondsPerDay = 24 * 60 * 60 * 1000;
const maximumTripDays = 366;
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type TripDay = {
    day: number;
    date: string;
    dateLabel: string;
    accessibleLabel: string;
};

function parseDate(date: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
        return null;
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const timestamp = Date.UTC(year, month - 1, day);
    const value = new Date(timestamp);

    if (
        value.getUTCFullYear() !== year ||
        value.getUTCMonth() !== month - 1 ||
        value.getUTCDate() !== day
    ) {
        return null;
    }

    return { timestamp };
}

export function getTripDays(startDate: string, endDate: string): TripDay[] {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) {
        return [];
    }

    const elapsedDays = (end.timestamp - start.timestamp) / millisecondsPerDay;
    const dayCount = elapsedDays + 1;

    if (
        !Number.isSafeInteger(dayCount) ||
        dayCount < 1 ||
        dayCount > maximumTripDays
    ) {
        return [];
    }

    return Array.from({ length: dayCount }, (_, index) => {
        const value = new Date(start.timestamp + index * millisecondsPerDay);
        const year = value.getUTCFullYear();
        const month = value.getUTCMonth() + 1;
        const date = value.getUTCDate();
        const weekday = weekdayLabels[value.getUTCDay()];
        const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

        return {
            day: index + 1,
            date: isoDate,
            dateLabel: `${String(month).padStart(2, "0")}.${String(date).padStart(2, "0")} (${weekday})`,
            accessibleLabel: `${index + 1}일차, ${month}월 ${date}일 ${weekday}요일`,
        };
    });
}
