import { Plane, Ship } from "lucide-react";

import type { TransportType } from "../../../../trips/store";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type TransportStepProps = {
    transportType: TransportType | null;
    headingRef: StepHeadingRef;
    onChange: (transportType: TransportType) => void;
};

export function TransportStep({
    transportType,
    headingRef,
    onChange,
}: TransportStepProps) {
    return (
        <section>
            <StepHeader
                title="어떻게 이동하나요?"
                description="출국할 때 이용할 교통수단을 선택해주세요."
                headingRef={headingRef}
            />
            <fieldset className={styles.choiceFieldset}>
                <legend className={styles.srOnly}>교통수단</legend>
                <div className={styles.transportGrid}>
                    <TransportOption
                        type="flight"
                        label="비행기"
                        selected={transportType === "flight"}
                        onSelect={onChange}
                    />
                    <TransportOption
                        type="ship"
                        label="배"
                        selected={transportType === "ship"}
                        onSelect={onChange}
                    />
                </div>
            </fieldset>
        </section>
    );
}

type TransportOptionProps = {
    type: TransportType;
    label: string;
    selected: boolean;
    onSelect: (type: TransportType) => void;
};

function TransportOption({
    type,
    label,
    selected,
    onSelect,
}: TransportOptionProps) {
    const Icon = type === "flight" ? Plane : Ship;

    return (
        <label className={styles.transportOption}>
            <input
                className={styles.choiceInput}
                type="radio"
                name="transport"
                value={type}
                checked={selected}
                onChange={() => onSelect(type)}
            />
            <Icon aria-hidden="true" />
            <strong>{label}</strong>
        </label>
    );
}
