import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { useTripStore, type Trip } from "../../trips/store";
import { RootHeader } from "./components/RootHeader";
import { TripCard } from "./components/TripCard";
import { TripDialog, type TripDialogView } from "./components/TripDialog";
import { getDaysUntilTrip, getTripSections } from "./trip";
import styles from "./style.module.css";

type DialogState = {
    tripId: string;
    view: TripDialogView;
};

type RootPageProps = {
    today?: Date;
};

export function RootPage({ today = new Date() }: RootPageProps) {
    const trips = useTripStore((state) => state.trips);
    const renameTrip = useTripStore((state) => state.renameTrip);
    const removeTrip = useTripStore((state) => state.removeTrip);
    const [dialogState, setDialogState] = useState<DialogState | null>(null);
    const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);
    const pageTitleRef = useRef<HTMLHeadingElement | null>(null);
    const { upcomingTrip, otherTrips } = getTripSections(trips, today);
    const selectedTrip = dialogState
        ? trips.find((trip) => trip.id === dialogState.tripId)
        : undefined;

    const openDialog = (
        trip: Trip,
        view: TripDialogView,
        trigger: HTMLButtonElement,
    ) => {
        dialogTriggerRef.current = trigger;
        setDialogState({ tripId: trip.id, view });
    };

    const closeDialog = () => {
        setDialogState(null);
        dialogTriggerRef.current?.focus();
    };

    const openEditDialog = (trip: Trip, trigger: HTMLButtonElement) => {
        openDialog(trip, "edit", trigger);
    };

    const openDeleteDialog = (trip: Trip, trigger: HTMLButtonElement) => {
        openDialog(trip, "delete", trigger);
    };

    const saveTripName = (name: string) => {
        if (!selectedTrip) {
            return;
        }

        renameTrip(selectedTrip.id, name);
        closeDialog();
    };

    const deleteTrip = () => {
        if (!selectedTrip) {
            return;
        }

        removeTrip(selectedTrip.id);
        setDialogState(null);
        pageTitleRef.current?.focus();
    };

    return (
        <div className={styles.page}>
            <RootHeader />

            <main className={styles.container}>
                <section>
                    <div className={styles.sectionHeader}>
                        <h1
                            className={styles.sectionTitle}
                            ref={pageTitleRef}
                            tabIndex={-1}
                        >
                            {upcomingTrip ? "다가오는 여행" : "여행 리스트"}
                        </h1>

                        <Link className={styles.addButton} to="/trips/new">
                            <Plus aria-hidden="true" strokeWidth={2} />
                            여행 추가하기
                        </Link>
                    </div>

                    {trips.length === 0 ? (
                        <section
                            className={styles.empty}
                            aria-label="여행 목록"
                        >
                            <p>아직 생성된 여행이 없습니다.</p>
                        </section>
                    ) : upcomingTrip ? (
                        <div className={styles.featuredCard}>
                            <TripCard
                                trip={upcomingTrip}
                                imagePriority
                                variant="featured"
                                daysUntilStart={getDaysUntilTrip(
                                    upcomingTrip.startDate,
                                    today,
                                )}
                                headingLevel={2}
                                onEdit={openEditDialog}
                                onDelete={openDeleteDialog}
                            />
                        </div>
                    ) : (
                        <ul className={styles.list} aria-label="여행 목록">
                            {otherTrips.map((trip, index) => (
                                <li key={trip.id}>
                                    <TripCard
                                        trip={trip}
                                        imagePriority={index === 0}
                                        headingLevel={2}
                                        onEdit={openEditDialog}
                                        onDelete={openDeleteDialog}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {upcomingTrip && otherTrips.length > 0 ? (
                    <section
                        className={styles.otherSection}
                        aria-labelledby="other-trips-title"
                    >
                        <h2
                            className={styles.subsectionTitle}
                            id="other-trips-title"
                        >
                            다른 여행
                        </h2>
                        <ul className={styles.list} aria-label="다른 여행 목록">
                            {otherTrips.map((trip) => (
                                <li key={trip.id}>
                                    <TripCard
                                        trip={trip}
                                        headingLevel={3}
                                        onEdit={openEditDialog}
                                        onDelete={openDeleteDialog}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </main>

            {dialogState && selectedTrip ? (
                <TripDialog
                    trip={selectedTrip}
                    view={dialogState.view}
                    onClose={closeDialog}
                    onSave={saveTripName}
                    onDelete={deleteTrip}
                />
            ) : null}
        </div>
    );
}
