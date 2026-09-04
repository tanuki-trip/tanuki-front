import { useRef, useState } from "react";
import { Plus } from "lucide-react";

import { TripCard } from "./components/TripCard";
import { TripDialog, type TripDialogView } from "./components/TripDialog";
import { mockTrips, type Trip } from "./trip";
import styles from "./style.module.css";

type DialogState = {
    tripId: string;
    view: TripDialogView;
};

export function RootPage() {
    const [trips, setTrips] = useState(mockTrips);
    const [dialogState, setDialogState] = useState<DialogState | null>(null);
    const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);
    const pageTitleRef = useRef<HTMLHeadingElement | null>(null);
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

        setTrips((currentTrips) =>
            currentTrips.map((trip) =>
                trip.id === selectedTrip.id ? { ...trip, name } : trip,
            ),
        );
        closeDialog();
    };

    const deleteTrip = () => {
        if (!selectedTrip) {
            return;
        }

        setTrips((currentTrips) =>
            currentTrips.filter((trip) => trip.id !== selectedTrip.id),
        );
        setDialogState(null);
        pageTitleRef.current?.focus();
    };

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1
                        className={styles.title}
                        ref={pageTitleRef}
                        tabIndex={-1}
                    >
                        여행 리스트
                    </h1>
                </header>

                {trips.length === 0 ? (
                    <section className={styles.empty} aria-label="여행 목록">
                        <p>아직 생성된 여행이 없습니다.</p>
                    </section>
                ) : (
                    <ul className={styles.list} aria-label="여행 목록">
                        {trips.map((trip, index) => (
                            <li key={trip.id}>
                                <TripCard
                                    trip={trip}
                                    imagePriority={index === 0}
                                    onEdit={openEditDialog}
                                    onDelete={openDeleteDialog}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button className={styles.addButton} type="button">
                <Plus aria-hidden="true" strokeWidth={2} />
                여행 추가하기
            </button>

            {dialogState && selectedTrip ? (
                <TripDialog
                    trip={selectedTrip}
                    view={dialogState.view}
                    onClose={closeDialog}
                    onSave={saveTripName}
                    onDelete={deleteTrip}
                />
            ) : null}
        </main>
    );
}
