import type { TransportType } from "../../../../trips/store";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type ReservationStepProps = {
    transportType: TransportType;
    transportRef: string;
    headingRef: StepHeadingRef;
    onChange: (transportRef: string) => void;
};

export function ReservationStep({
    transportType,
    transportRef,
    headingRef,
    onChange,
}: ReservationStepProps) {
    const fieldLabel =
        transportType === "ship" ? "선편 또는 예약번호" : "편명 또는 예약번호";

    return (
        <section>
            <StepHeader
                title="예약 정보가 있나요?"
                description="아직 없다면 비워두고 넘어가도 괜찮아요."
                headingRef={headingRef}
            />
            <label className={`${styles.field} ${styles.reservationField}`}>
                <span>{fieldLabel}</span>
                <input
                    type="text"
                    value={transportRef}
                    maxLength={100}
                    placeholder={
                        transportType === "ship"
                            ? "예: PANSTAR 또는 예약번호"
                            : "예: KE703 또는 예약번호"
                    }
                    onChange={(event) => onChange(event.target.value)}
                />
            </label>
        </section>
    );
}
