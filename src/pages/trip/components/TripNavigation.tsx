import {
    CalendarDays,
    PawPrint,
    Search,
    Settings,
    WalletCards,
    type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import styles from "./TripNavigation.module.css";

type TripNavigationProps = {
    activeTab: TripTab;
    onTabChange: (tab: TripTab) => void;
};

export type TripTab = "schedule" | "search" | "budget" | "settings";

type NavigationItem = {
    key: TripTab;
    label: string;
    icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
    { key: "schedule", label: "일정", icon: CalendarDays },
    { key: "search", label: "장소 검색", icon: Search },
    { key: "budget", label: "예산", icon: WalletCards },
    { key: "settings", label: "설정", icon: Settings },
];

export function TripNavigation({
    activeTab,
    onTabChange,
}: TripNavigationProps) {
    return (
        <nav className={styles.navigation} aria-label="여행 메뉴">
            <Link
                className={styles.brandLink}
                to="/"
                aria-label="여행 목록으로"
            >
                <PawPrint aria-hidden="true" strokeWidth={2.2} />
            </Link>

            <div className={styles.items}>
                {navigationItems.map(({ key, label, icon: Icon }) => {
                    const isActive = activeTab === key;

                    return (
                        <button
                            className={`${styles.item} ${isActive ? styles.activeItem : ""}`}
                            key={key}
                            type="button"
                            aria-label={label}
                            aria-pressed={isActive}
                            title={label}
                            onClick={() => onTabChange(key)}
                        >
                            <Icon
                                aria-hidden="true"
                                strokeWidth={isActive ? 2.4 : 1.9}
                            />
                        </button>
                    );
                })}
            </div>

            <span className={styles.statusDot} aria-hidden="true" />
        </nav>
    );
}
