import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../../auth/store";
import { getCountry, type CountryCode } from "../../../trips/countries";
import { useTripStore, type TransportType } from "../../../trips/store";
import { CountryStep } from "./components/CountryStep";
import { DateStep } from "./components/DateStep";
import { MembersStep, type Companion } from "./components/MembersStep";
import { ReservationStep } from "./components/ReservationStep";
import { ReviewStep } from "./components/ReviewStep";
import { TransportStep } from "./components/TransportStep";
import { getTripDayCount } from "./trip-form";
import styles from "./style.module.css";

const TRIP_STEP = {
    country: 0,
    dates: 1,
    members: 2,
    transport: 3,
    reservation: 4,
    review: 5,
} as const;

const LAST_STEP = TRIP_STEP.review;
const STEP_COUNT = LAST_STEP + 1;

export function CreateTripPage() {
    const navigate = useNavigate();
    const addTrip = useTripStore((state) => state.addTrip);
    const displayName = useAuthStore((state) => state.user?.displayName);
    const ownerName = displayName?.trim() || "나";
    const [step, setStep] = useState(0);
    const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
    const [dates, setDates] = useState({ startDate: "", endDate: "" });
    const [isDayTrip, setIsDayTrip] = useState(false);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [transportType, setTransportType] = useState<TransportType | null>(
        null,
    );
    const [transportRef, setTransportRef] = useState("");
    const nextCompanionId = useRef(0);
    const stepTitleRef = useRef<HTMLHeadingElement | null>(null);
    const { startDate, endDate } = dates;
    const dayCount = getTripDayCount(startDate, endDate);
    const hasCompleteDates =
        dayCount !== null && (isDayTrip ? dayCount === 1 : dayCount >= 2);
    const selectedCountry = countryCode ? getCountry(countryCode) : null;

    useEffect(() => {
        stepTitleRef.current?.focus();
    }, [step]);

    const canContinue =
        (step === TRIP_STEP.country && countryCode !== null) ||
        (step === TRIP_STEP.dates && hasCompleteDates) ||
        step === TRIP_STEP.members ||
        (step === TRIP_STEP.transport && transportType !== null) ||
        step >= TRIP_STEP.reservation;

    const addCompanion = (name: string) => {
        setCompanions((currentCompanions) => [
            ...currentCompanions,
            { id: nextCompanionId.current, name },
        ]);
        nextCompanionId.current += 1;
    };

    const removeCompanion = (companionId: number) => {
        setCompanions((currentCompanions) =>
            currentCompanions.filter(({ id }) => id !== companionId),
        );
    };

    const completeTrip = () => {
        if (
            !selectedCountry ||
            !startDate ||
            !endDate ||
            !hasCompleteDates ||
            !transportType
        ) {
            return;
        }

        addTrip({
            name: `${selectedCountry.name} 여행`,
            country: selectedCountry.name,
            countryCode: selectedCountry.code,
            currencyCode: selectedCountry.currencyCode,
            startDate,
            endDate,
            memberNames: [ownerName, ...companions.map(({ name }) => name)],
            transportType,
            transportRef: transportRef.trim() || undefined,
        });
        navigate("/");
    };

    const goForward = () => {
        if (!canContinue) {
            return;
        }

        if (step === LAST_STEP) {
            completeTrip();
        } else {
            setStep((currentStep) => currentStep + 1);
        }
    };

    return (
        <main className={styles.page}>
            <header className={styles.topBar}>
                <p className={styles.progressText} aria-live="polite">
                    {step + 1} / {STEP_COUNT}
                </p>
                <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-label="여행 생성 진행률"
                    aria-valuemin={1}
                    aria-valuemax={STEP_COUNT}
                    aria-valuenow={step + 1}
                >
                    <span
                        className={styles.progressValue}
                        style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
                    />
                </div>
                <Link
                    className={styles.closeButton}
                    to="/"
                    aria-label="여행 생성 취소"
                >
                    <X aria-hidden="true" />
                </Link>
            </header>

            <div className={styles.content} key={step}>
                {step === TRIP_STEP.country ? (
                    <CountryStep
                        countryCode={countryCode}
                        headingRef={stepTitleRef}
                        onChange={setCountryCode}
                    />
                ) : null}
                {step === TRIP_STEP.dates ? (
                    <DateStep
                        startDate={startDate}
                        endDate={endDate}
                        dayCount={dayCount}
                        isDayTrip={isDayTrip}
                        headingRef={stepTitleRef}
                        onRangeChange={(nextStartDate, nextEndDate) =>
                            setDates({
                                startDate: nextStartDate,
                                endDate: nextEndDate,
                            })
                        }
                        onDayTripChange={(nextIsDayTrip) => {
                            setIsDayTrip(nextIsDayTrip);
                            setDates((currentDates) => ({
                                startDate: currentDates.startDate,
                                endDate: nextIsDayTrip
                                    ? currentDates.startDate
                                    : "",
                            }));
                        }}
                    />
                ) : null}
                {step === TRIP_STEP.members ? (
                    <MembersStep
                        ownerName={ownerName}
                        companions={companions}
                        headingRef={stepTitleRef}
                        onAdd={addCompanion}
                        onRemove={removeCompanion}
                    />
                ) : null}
                {step === TRIP_STEP.transport ? (
                    <TransportStep
                        transportType={transportType}
                        headingRef={stepTitleRef}
                        onChange={setTransportType}
                    />
                ) : null}
                {step === TRIP_STEP.reservation && transportType ? (
                    <ReservationStep
                        transportType={transportType}
                        transportRef={transportRef}
                        headingRef={stepTitleRef}
                        onChange={setTransportRef}
                    />
                ) : null}
                {step === TRIP_STEP.review &&
                selectedCountry &&
                endDate &&
                hasCompleteDates &&
                dayCount !== null &&
                transportType ? (
                    <ReviewStep
                        country={selectedCountry}
                        startDate={startDate}
                        endDate={endDate}
                        dayCount={dayCount}
                        memberCount={companions.length + 1}
                        transportType={transportType}
                        transportRef={transportRef}
                        headingRef={stepTitleRef}
                    />
                ) : null}
            </div>

            <nav className={styles.navigation} aria-label="여행 생성 단계 이동">
                <div className={styles.actions}>
                    {step > 0 ? (
                        <button
                            className={styles.backButton}
                            type="button"
                            onClick={() =>
                                setStep((currentStep) => currentStep - 1)
                            }
                        >
                            <ArrowLeft aria-hidden="true" />
                            이전
                        </button>
                    ) : null}
                    <button
                        className={styles.nextButton}
                        type="button"
                        disabled={!canContinue}
                        onClick={goForward}
                    >
                        {step === LAST_STEP ? "여행 만들기" : "다음"}
                    </button>
                </div>
            </nav>
        </main>
    );
}
