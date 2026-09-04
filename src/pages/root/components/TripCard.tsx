import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { CalendarDays, EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { CountryFlag } from "../../../components/CountryFlag";
import type { Trip } from "../../../trips/store";
import {
    formatCompactEndDate,
    formatCompactStartDate,
    getTripCover,
} from "../trip";
import styles from "./TripCard.module.css";

type TripCardProps = {
    trip: Trip;
    imagePriority?: boolean;
    variant?: "standard" | "featured";
    daysUntilStart?: number;
    headingLevel?: 2 | 3;
    onEdit: (trip: Trip, trigger: HTMLButtonElement) => void;
    onDelete: (trip: Trip, trigger: HTMLButtonElement) => void;
};

export function TripCard({
    trip,
    imagePriority = false,
    variant = "standard",
    daysUntilStart,
    headingLevel = 2,
    onEdit,
    onDelete,
}: TripCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
    const Title = headingLevel === 2 ? "h2" : "h3";
    const isFeatured = variant === "featured";

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
                menuTriggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            return;
        }

        event.preventDefault();
        const menuItems = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"]',
            ),
        );
        const currentIndex = menuItems.indexOf(
            document.activeElement as HTMLButtonElement,
        );

        if (event.key === "Home") {
            menuItems.at(0)?.focus();
        } else if (event.key === "End") {
            menuItems.at(-1)?.focus();
        } else {
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const nextIndex =
                (currentIndex + direction + menuItems.length) %
                menuItems.length;
            menuItems.at(nextIndex)?.focus();
        }
    };

    const openDialog = (view: "edit" | "delete") => {
        const trigger = menuTriggerRef.current;

        if (!trigger) {
            return;
        }

        setIsMenuOpen(false);

        if (view === "edit") {
            onEdit(trip, trigger);
        } else {
            onDelete(trip, trigger);
        }
    };

    return (
        <article
            className={`${styles.card} ${isFeatured ? styles.featured : ""}`}
            aria-labelledby={`${trip.id}-title`}
        >
            <div className={styles.cover}>
                <img
                    className={styles.coverImage}
                    src={getTripCover(trip.countryCode)}
                    alt=""
                    loading={imagePriority ? "eager" : "lazy"}
                    fetchPriority={imagePriority ? "high" : undefined}
                    decoding="async"
                />
                {isFeatured && daysUntilStart !== undefined ? (
                    <span
                        className={styles.dayBadge}
                        aria-label={
                            daysUntilStart === 0
                                ? "오늘 출발"
                                : `${daysUntilStart}일 후 출발`
                        }
                    >
                        {daysUntilStart === 0 ? "D-DAY" : `D-${daysUntilStart}`}
                    </span>
                ) : null}
                <div className={styles.cardHeader}>
                    <div className={styles.countryGroup}>
                        <CountryFlag
                            className={styles.flag}
                            code={trip.countryCode}
                        />
                        <p className={styles.country}>{trip.country}</p>
                    </div>
                </div>
            </div>

            <div
                className={styles.menuControl}
                ref={menuRef}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setIsMenuOpen(false);
                    }
                }}
            >
                <button
                    className={styles.menuButton}
                    ref={menuTriggerRef}
                    type="button"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    aria-label={`${trip.name} 메뉴 열기`}
                    onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                >
                    <EllipsisVertical aria-hidden="true" />
                </button>

                {isMenuOpen ? (
                    <div
                        className={styles.popover}
                        role="menu"
                        aria-label={`${trip.name} 관리`}
                        onKeyDown={handleMenuKeyDown}
                    >
                        <button
                            className={styles.popoverButton}
                            type="button"
                            role="menuitem"
                            autoFocus
                            onClick={() => openDialog("edit")}
                        >
                            <Pencil aria-hidden="true" />
                            이름 수정
                        </button>
                        <button
                            className={styles.popoverButton}
                            type="button"
                            role="menuitem"
                            onClick={() => openDialog("delete")}
                        >
                            <Trash2 aria-hidden="true" />
                            삭제
                        </button>
                    </div>
                ) : null}
            </div>

            <div className={styles.cardBody}>
                <Title className={styles.cardTitle} id={`${trip.id}-title`}>
                    {trip.name}
                </Title>

                <div className={styles.meta}>
                    <p className={`${styles.metaItem} ${styles.tripDetails}`}>
                        <CalendarDays aria-hidden="true" />
                        <span className={styles.dateRange}>
                            <time dateTime={trip.startDate}>
                                {formatCompactStartDate(trip.startDate)}
                            </time>
                            {trip.startDate !== trip.endDate ? (
                                <>
                                    <span aria-hidden="true">–</span>
                                    <time dateTime={trip.endDate}>
                                        {formatCompactEndDate(
                                            trip.startDate,
                                            trip.endDate,
                                        )}
                                    </time>
                                </>
                            ) : null}
                        </span>
                        <span
                            className={styles.detailSeparator}
                            aria-hidden="true"
                        >
                            ·
                        </span>
                        <span>{trip.members.length}명</span>
                    </p>
                </div>
            </div>
        </article>
    );
}
