import type { CountryCode } from "../../../../trips/countries";
import type { HubTransportType } from "../../../../trips/transport";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";
import { TransportHubSearch } from "./TransportHubSearch";

type DestinationHubStepProps = {
    countryCode: CountryCode;
    transportType: HubTransportType;
    arrivalHubId: string | null;
    usesDifferentReturn: boolean;
    headingRef: StepHeadingRef;
    onArrivalHubChange: (hubId: string) => void;
    onDifferentReturnChange: (isDifferent: boolean) => void;
};

export function DestinationHubStep({
    countryCode,
    transportType,
    arrivalHubId,
    usesDifferentReturn,
    headingRef,
    onArrivalHubChange,
    onDifferentReturnChange,
}: DestinationHubStepProps) {
    const hubLabel = transportType === "flight" ? "공항" : "항구";
    const hubObjectParticle = transportType === "flight" ? "을" : "를";

    return (
        <section>
            <StepHeader
                title={`여행지 ${hubLabel}${hubObjectParticle} 선택해주세요`}
                description={`여행지 지역을 검색하면 가까운 ${hubLabel}${hubObjectParticle} 보여드려요.`}
                headingRef={headingRef}
            />
            <div className={styles.hubStepContent}>
                <TransportHubSearch
                    name="arrival-hub"
                    countryCode={countryCode}
                    transportType={transportType}
                    searchLabel="여행지 지역"
                    selectedHubId={arrivalHubId}
                    onChange={onArrivalHubChange}
                />

                <label className={styles.differentHubOption}>
                    <input
                        type="checkbox"
                        checked={usesDifferentReturn}
                        onChange={(event) =>
                            onDifferentReturnChange(event.target.checked)
                        }
                    />
                    돌아오는 편이 달라요
                </label>
            </div>
        </section>
    );
}
