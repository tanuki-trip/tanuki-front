import type { Country } from "../../../../trips/countries";
import type { TransportType } from "../../../../trips/store";
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
    transportRef: string;
    headingRef: StepHeadingRef;
};

export function ReviewStep({
    country,
    startDate,
    endDate,
    dayCount,
    memberCount,
    transportType,
    transportRef,
    headingRef,
}: ReviewStepProps) {
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
                    <dt>교통수단</dt>
                    <dd>
                        {transportType === "flight" ? "비행기" : "배"}
                        {transportRef.trim() ? (
                            <span>{transportRef.trim()}</span>
                        ) : null}
                    </dd>
                </div>
            </dl>
        </section>
    );
}
