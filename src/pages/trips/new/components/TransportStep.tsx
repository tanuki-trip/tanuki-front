import { Plane, Ship } from "lucide-react";

import {
    transportLabels,
    type HubTransportType,
    type TransportType,
} from "../../../../trips/transport";
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
                description="여행지까지 이용할 교통수단을 선택해주세요."
                headingRef={headingRef}
            />
            <fieldset className={styles.choiceFieldset}>
                <legend className={styles.srOnly}>교통수단</legend>
                <div className={styles.transportGrid}>
                    <TransportOption
                        type="flight"
                        label={transportLabels.flight}
                        selected={transportType === "flight"}
                        onSelect={onChange}
                    />
                    <TransportOption
                        type="ship"
                        label={transportLabels.ship}
                        selected={transportType === "ship"}
                        onSelect={onChange}
                    />
                </div>
                <label className={styles.otherTransportOption}>
                    <input
                        className={styles.choiceInput}
                        type="radio"
                        name="transport"
                        value="other"
                        checked={transportType === "other"}
                        onChange={() => onChange("other")}
                    />
                    {transportLabels.other}
                </label>
            </fieldset>
        </section>
    );
}

type TransportOptionProps = {
    type: HubTransportType;
    label: string;
    selected: boolean;
    onSelect: (type: HubTransportType) => void;
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
