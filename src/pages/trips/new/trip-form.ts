const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTripDayCount(startDate: string, endDate: string) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);

    if (!start || !end) {
        return null;
    }

    const difference =
        Date.UTC(end.year, end.month - 1, end.day) -
        Date.UTC(start.year, start.month - 1, start.day);
    const elapsedDays = difference / MILLISECONDS_PER_DAY;

    return Number.isSafeInteger(elapsedDays) && elapsedDays >= 0
        ? elapsedDays + 1
        : null;
}

export function formatTripDuration(dayCount: number) {
    return dayCount === 1 ? "당일치기" : `총 ${dayCount}일`;
}

export function parseTripDate(date: string) {
    const parts = parseIsoDate(date);

    return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
}

export function toTripDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function formatCompactTripPeriod(startDate: string, endDate: string) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);

    if (!start || !end) {
        return "";
    }

    const startText = `${start.year}. ${start.month}. ${start.day}.`;

    if (startDate === endDate) {
        return startText;
    }

    if (start.year === end.year && start.month === end.month) {
        return `${startText} – ${end.day}.`;
    }

    if (start.year === end.year) {
        return `${startText} – ${end.month}. ${end.day}.`;
    }

    return `${startText} – ${end.year}. ${end.month}. ${end.day}.`;
}

function parseIsoDate(date: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
        return null;
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const value = new Date(Date.UTC(year, month - 1, day));

    if (
        value.getUTCFullYear() !== year ||
        value.getUTCMonth() !== month - 1 ||
        value.getUTCDate() !== day
    ) {
        return null;
    }

    return { year, month, day };
}
