import type { CountryCode } from "../../../../trips/countries";
import {
    transportLabels,
    type TransportType,
} from "../../../../trips/transport";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";
import { TransportHubSearch } from "./TransportHubSearch";

type ReturnTripStepProps = {
    countryCode: CountryCode;
    transportType: TransportType | null;
    departureHubId: string | null;
    headingRef: StepHeadingRef;
    onTransportTypeChange: (transportType: TransportType) => void;
    onDepartureHubChange: (hubId: string) => void;
};

const transportOptions: readonly TransportType[] = ["flight", "ship", "other"];

export function ReturnTripStep({
    countryCode,
    transportType,
    departureHubId,
    headingRef,
    onTransportTypeChange,
    onDepartureHubChange,
}: ReturnTripStepProps) {
    return (
        <section>
            <StepHeader
                title="어디에서 돌아오나요?"
                description="가는 편과 다른 교통수단이나 출발 장소를 선택할 수 있어요."
                headingRef={headingRef}
            />
            <div className={styles.hubStepContent}>
                <fieldset className={styles.hubFieldset}>
                    <legend>집으로 돌아오는 교통수단</legend>
                    <div className={styles.returnTransportOptions}>
                        {transportOptions.map((option) => (
                            <label
                                className={styles.returnTransportOption}
                                key={option}
                            >
                                <input
                                    className={styles.choiceInput}
                                    type="radio"
                                    name="return-transport"
                                    value={option}
                                    checked={transportType === option}
                                    onChange={() =>
                                        onTransportTypeChange(option)
                                    }
                                />
                                {transportLabels[option]}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {transportType && transportType !== "other" ? (
                    <TransportHubSearch
                        key={transportType}
                        name="departure-hub"
                        countryCode={countryCode}
                        transportType={transportType}
                        searchLabel="출발지 지역"
                        selectedHubId={departureHubId}
                        onChange={onDepartureHubChange}
                    />
                ) : null}

                {transportType === "other" ? (
                    <p className={styles.returnHint}>
                        돌아오는 장소는 일정에서 직접 추가해주세요.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
