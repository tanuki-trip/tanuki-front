import type { Country } from "../../../../trips/countries";
import {
    transportLabels,
    type TransportType,
} from "../../../../trips/transport";
import type { TransportHub } from "../../../../trips/transport-hubs";
import { formatCompactTripPeriod, formatTripDuration } from "../trip-form";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type ReviewStepProps = {
    country: Country;
    startDate: string;
    endDate: string;
    dayCount: number;
    memberCount: number;
    transportType: TransportType;
    returnTransportType?: TransportType;
    arrivalHub?: TransportHub;
    departureHub?: TransportHub;
    headingRef: StepHeadingRef;
};

export function ReviewStep({
    country,
    startDate,
    endDate,
    dayCount,
    memberCount,
    transportType,
    returnTransportType,
    arrivalHub,
    departureHub,
    headingRef,
}: ReviewStepProps) {
    const hasDifferentReturn =
        returnTransportType !== undefined &&
        (returnTransportType !== transportType ||
            arrivalHub?.id !== departureHub?.id);

    return (
        <section>
            <StepHeader
                title="여행 준비가 끝났어요"
                description="입력한 내용을 확인하고 여행을 만들어주세요."
                headingRef={headingRef}
            />
            <dl className={styles.reviewList}>
                <div>
                    <dt>여행 이름</dt>
                    <dd>{country.name} 여행</dd>
                </div>
                <div>
                    <dt>국가·통화</dt>
                    <dd>
                        {country.name} · {country.currencyCode}
                    </dd>
                </div>
                <div>
                    <dt>기간</dt>
                    <dd>
                        {formatCompactTripPeriod(startDate, endDate)}
                        <span>{formatTripDuration(dayCount)}</span>
                    </dd>
                </div>
                <div>
                    <dt>인원</dt>
                    <dd>{memberCount}명</dd>
                </div>
                <div>
                    <dt>가는 교통수단</dt>
                    <dd>{transportLabels[transportType]}</dd>
                </div>
                {arrivalHub ? (
                    <HubSummary label="여행지" hub={arrivalHub} />
                ) : null}
                {hasDifferentReturn ? (
                    <>
                        <div>
                            <dt>돌아오는 교통수단</dt>
                            <dd>{transportLabels[returnTransportType]}</dd>
                        </div>
                        {departureHub ? (
                            <HubSummary
                                label="귀국 출발지"
                                hub={departureHub}
                            />
                        ) : null}
                    </>
                ) : null}
            </dl>
        </section>
    );
}

function HubSummary({ label, hub }: { label: string; hub: TransportHub }) {
    return (
        <div>
            <dt>
                {label} {hub.kind === "airport" ? "공항" : "항구"}
            </dt>
            <dd>
                {hub.name}
                <span>{hub.code}</span>
            </dd>
        </div>
    );
}
