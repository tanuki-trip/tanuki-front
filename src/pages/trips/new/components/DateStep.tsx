import { DayPicker, type DateRange } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import { ArrowRight } from "lucide-react";
import "@daypicker/react/style.css";

import {
    formatCompactTripPeriod,
    formatTripDuration,
    parseTripDate,
    toTripDateString,
} from "../trip-form";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type DateStepProps = {
    startDate: string;
    endDate: string;
    dayCount: number | null;
    isDayTrip: boolean;
    headingRef: StepHeadingRef;
    onRangeChange: (startDate: string, endDate: string) => void;
    onDayTripChange: (isDayTrip: boolean) => void;
};

export function DateStep({
    startDate,
    endDate,
    dayCount,
    isDayTrip,
    headingRef,
    onRangeChange,
    onDayTripChange,
}: DateStepProps) {
    const start = parseTripDate(startDate) ?? undefined;
    const end = parseTripDate(endDate) ?? undefined;
    const selectedRange: DateRange | undefined = start
        ? { from: start, to: end }
        : undefined;
    const instruction = isDayTrip
        ? "하루 머무를 날짜를 선택해주세요."
        : start && !end
          ? "이제 도착일을 선택해주세요."
          : start && end
            ? "다른 날짜를 누르면 새로 선택할 수 있어요."
            : "출발일을 먼저 선택해주세요.";
    const durationText =
        start && end && dayCount !== null ? formatTripDuration(dayCount) : "";

    const handleRangeSelect = (range: DateRange | undefined) => {
        onRangeChange(
            range?.from ? toTripDateString(range.from) : "",
            range?.to ? toTripDateString(range.to) : "",
        );
    };

    return (
        <section>
            <StepHeader
                title="언제 떠나나요?"
                description="달력에서 출발일과 도착일을 차례로 선택해주세요."
                headingRef={headingRef}
            />

            <div className={styles.dateRangeStatus} aria-live="polite">
                <div>
                    <span>출발일</span>
                    <strong>
                        {startDate
                            ? formatCompactTripPeriod(startDate, startDate)
                            : "선택 전"}
                    </strong>
                </div>
                <ArrowRight aria-hidden="true" />
                <div>
                    <span>도착일</span>
                    <strong>
                        {endDate
                            ? formatCompactTripPeriod(endDate, endDate)
                            : "선택 전"}
                    </strong>
                </div>
            </div>

            <div className={styles.dateToolbar}>
                <p>{instruction}</p>
                <label className={styles.dayTripOption}>
                    <input
                        type="checkbox"
                        checked={isDayTrip}
                        onChange={(event) =>
                            onDayTripChange(event.target.checked)
                        }
                    />
                    <span>당일치기예요</span>
                </label>
            </div>

            <div className={styles.calendarFrame}>
                {isDayTrip ? (
                    <DayPicker
                        aria-label="당일치기 날짜 선택"
                        className={`${styles.calendar} ${styles.singleCalendar}`}
                        defaultMonth={start}
                        fixedWeeks
                        locale={ko}
                        mode="single"
                        navLayout="around"
                        selected={start}
                        showOutsideDays
                        onSelect={(date) => {
                            const selectedDate = date
                                ? toTripDateString(date)
                                : "";

                            onRangeChange(selectedDate, selectedDate);
                        }}
                    />
                ) : (
                    <DayPicker
                        aria-label="여행 기간 선택"
                        className={styles.calendar}
                        defaultMonth={start}
                        fixedWeeks
                        locale={ko}
                        min={1}
                        mode="range"
                        navLayout="around"
                        resetOnSelect
                        selected={selectedRange}
                        showOutsideDays
                        onSelect={handleRangeSelect}
                    />
                )}
            </div>

            <p
                className={styles.durationStatus}
                role="status"
                aria-label="여행 기간 요약"
            >
                {durationText}
            </p>
        </section>
    );
}
