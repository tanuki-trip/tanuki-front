import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type NameStepProps = {
    name: string;
    headingRef: StepHeadingRef;
    onChange: (name: string) => void;
};

export function NameStep({ name, headingRef, onChange }: NameStepProps) {
    return (
        <section>
            <StepHeader
                title="여행 이름을 정해주세요"
                description="어떤 여행인지 알아보기 쉬운 이름을 입력해주세요."
                headingRef={headingRef}
            />
            <div className={styles.nameStepContent}>
                <label className={styles.field} htmlFor="trip-name">
                    여행 이름
                    <input
                        type="text"
                        id="trip-name"
                        value={name}
                        placeholder="예: 후쿠오카 미식 여행"
                        autoComplete="off"
                        required
                        onChange={(event) => onChange(event.target.value)}
                    />
                </label>
            </div>
        </section>
    );
}
