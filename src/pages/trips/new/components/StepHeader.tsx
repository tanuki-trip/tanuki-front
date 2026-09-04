import type { RefObject } from "react";

import styles from "./style.module.css";

export type StepHeadingRef = RefObject<HTMLHeadingElement | null>;

type StepHeaderProps = {
    title: string;
    description: string;
    headingRef: StepHeadingRef;
};

export function StepHeader({
    title,
    description,
    headingRef,
}: StepHeaderProps) {
    return (
        <>
            <h1 className={styles.title} ref={headingRef} tabIndex={-1}>
                {title}
            </h1>
            <p className={styles.description}>{description}</p>
        </>
    );
}
