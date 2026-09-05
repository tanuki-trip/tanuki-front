import { useId, type ReactNode } from "react";

import styles from "./TripContentPanel.module.css";

type TripContentPanelProps = {
    children?: ReactNode;
    hideTitle?: boolean;
    title: string;
};

export function TripContentPanel({
    children,
    hideTitle = false,
    title,
}: TripContentPanelProps) {
    const titleId = useId();

    return (
        <aside
            className={styles.panel}
            aria-label={hideTitle ? title : undefined}
            aria-labelledby={hideTitle ? undefined : titleId}
        >
            {hideTitle ? null : (
                <h2 className={styles.title} id={titleId} aria-live="polite">
                    {title}
                </h2>
            )}
            {children ? (
                <div
                    className={`${styles.content} ${hideTitle ? styles.contentWithoutTitle : ""}`}
                >
                    {children}
                </div>
            ) : null}
        </aside>
    );
}
