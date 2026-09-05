import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getTripPlacesForDay, type TripInbound } from "../../places/model";
import { reorderDayPlaces } from "../../places/reorder";
import {
    deleteTripPlace,
    moveTripPlace,
    updateTripPlaceDetails,
    type ScheduleDay,
    type TripPlaceDetailsPatch,
} from "../../places/schedule";
import { createTripEndpointPlaces } from "../../places/trip-endpoints";
import { useTripStore, type Trip } from "../../trips/store";
import { NotFoundPage } from "../not-found";
import { TripContentPanel } from "./components/TripContentPanel";
import { TripMap } from "./components/TripMap";
import { TripNavigation, type TripTab } from "./components/TripNavigation";
import {
    TripDayBadges,
    type TripDayKey,
} from "./components/schedule/TripDayBadges";
import { TripPlaceTimeline } from "./components/schedule/TripPlaceTimeline";
import { getTripDays } from "./trip-days";
import styles from "./style.module.css";

const panelTitles: Record<TripTab, string> = {
    schedule: "일정 관리",
    search: "장소 검색",
    budget: "예산",
    settings: "설정",
};

export function TripPage() {
    const { tripId } = useParams<{ tripId: string }>();
    const trip = useTripStore((state) =>
        state.trips.find((candidate) => candidate.id === tripId),
    );

    if (!trip) {
        return <NotFoundPage />;
    }

    return <TripWorkspace key={trip.id} trip={trip} />;
}

function TripWorkspace({ trip }: { trip: Trip }) {
    const [activeTab, setActiveTab] = useState<TripTab>("schedule");
    const [activeDay, setActiveDay] = useState<TripDayKey>(1);
    const tripDays = useMemo(
        () => getTripDays(trip.startDate, trip.endDate),
        [trip.endDate, trip.startDate],
    );
    const [places, setPlaces] = useState(() =>
        createTripEndpointPlaces(trip, tripDays.length),
    );
    const activePlaces = useMemo(
        () => getTripPlacesForDay(places, activeDay),
        [activeDay, places],
    );
    const [mapFocus, setMapFocus] = useState<{
        placeId: string;
        request: number;
    } | null>(() => {
        const firstPlace = activePlaces[0];

        return firstPlace ? { placeId: firstPlace.id, request: 1 } : null;
    });

    function handleDayChange(day: TripDayKey) {
        setActiveDay(day);
        setMapFocus(null);
    }

    function handlePlaceSelect(placeId: string) {
        setMapFocus((currentFocus) => ({
            placeId,
            request: (currentFocus?.request ?? 0) + 1,
        }));
    }

    function handleReorder(sourceId: string, targetId: string) {
        setPlaces((currentPlaces) =>
            reorderDayPlaces(currentPlaces, activeDay, sourceId, targetId),
        );
    }

    function handleInboundUpdate(placeId: string, inbound: TripInbound) {
        setPlaces((currentPlaces) =>
            currentPlaces.map((place) =>
                place.id === placeId ? { ...place, inbound } : place,
            ),
        );
    }

    function handlePlaceUpdate(placeId: string, patch: TripPlaceDetailsPatch) {
        setPlaces((currentPlaces) =>
            updateTripPlaceDetails(currentPlaces, placeId, patch),
        );
    }

    function handlePlaceDelete(placeId: string) {
        setPlaces((currentPlaces) => deleteTripPlace(currentPlaces, placeId));
        setMapFocus((currentFocus) =>
            currentFocus?.placeId === placeId ? null : currentFocus,
        );
    }

    function handlePlaceMove(placeId: string, day: ScheduleDay) {
        setPlaces((currentPlaces) =>
            moveTripPlace(currentPlaces, placeId, day),
        );
        setMapFocus((currentFocus) =>
            currentFocus?.placeId === placeId ? null : currentFocus,
        );
    }

    return (
        <div className={styles.shell}>
            <TripNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <TripContentPanel
                title={panelTitles[activeTab]}
                hideTitle={activeTab === "schedule"}
            >
                {activeTab === "schedule" ? (
                    <>
                        <TripDayBadges
                            startDate={trip.startDate}
                            endDate={trip.endDate}
                            activeDay={activeDay}
                            onDayChange={handleDayChange}
                        />
                        <TripPlaceTimeline
                            activeDay={activeDay}
                            dayCount={tripDays.length}
                            onDeletePlace={handlePlaceDelete}
                            onMovePlace={handlePlaceMove}
                            onPlaceSelect={handlePlaceSelect}
                            onReorder={handleReorder}
                            onUpdateInbound={handleInboundUpdate}
                            onUpdatePlace={handlePlaceUpdate}
                            places={activePlaces}
                            selectedPlaceId={mapFocus?.placeId}
                        />
                    </>
                ) : null}
            </TripContentPanel>
            <main className={`${styles.page} ${styles.mapPage}`}>
                <h1 className={styles.srOnly}>{trip.name}</h1>
                <TripMap
                    countryCode={trip.countryCode}
                    countryName={trip.country}
                    focusRequest={mapFocus?.request ?? 0}
                    focusedPlaceId={mapFocus?.placeId ?? null}
                    onPlaceSelect={handlePlaceSelect}
                    places={activePlaces}
                />
            </main>
        </div>
    );
}
