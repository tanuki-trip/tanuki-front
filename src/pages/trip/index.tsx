import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
    getTripPlacesForDay,
    type TripInbound,
    type TripPlace,
    type TripPlaceCost,
} from "../../places/model";
import { createMockTripPlaces } from "../../places/mock";
import { reorderDayPlaces } from "../../places/reorder";
import type { PlaceSearchResult } from "../../places/search";
import {
    addSearchPlaceToSchedule,
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
import { TripBudget } from "./components/budget/TripBudget";
import { TripPlaceSearch } from "./components/search/TripPlaceSearch";
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
    const [totalBudgetAmount, setTotalBudgetAmount] = useState<number | null>(
        null,
    );
    const tripDays = useMemo(
        () => getTripDays(trip.startDate, trip.endDate),
        [trip.endDate, trip.startDate],
    );
    const [places, setPlaces] = useState<readonly TripPlace[]>(() => [
        ...createTripEndpointPlaces(trip, tripDays.length),
        ...createMockTripPlaces({
            currencyCode: trip.currencyCode,
            tripId: trip.id,
        }),
    ]);
    const searchHub = trip.arrivalHub ?? trip.departureHub;
    const activePlaces = useMemo(
        () => getTripPlacesForDay(places, activeDay),
        [activeDay, places],
    );
    const [mapFocus, setMapFocus] = useState<
        | { source: "schedule"; placeId: string; request: number }
        | { source: "search"; place: PlaceSearchResult; request: number }
        | null
    >(() => {
        const firstPlace = activePlaces[0];

        return firstPlace
            ? { source: "schedule", placeId: firstPlace.id, request: 1 }
            : null;
    });
    const addedSearchPlaceSequenceRef = useRef(0);
    const pendingAddedPlaceFocusRef = useRef<string | null>(null);

    useEffect(() => {
        const placeId = pendingAddedPlaceFocusRef.current;

        if (activeTab !== "schedule" || !placeId) {
            return;
        }

        const placeCard = Array.from(
            document.querySelectorAll<HTMLElement>("[data-place-id]"),
        ).find((element) => element.dataset.placeId === placeId);

        placeCard
            ?.querySelector<HTMLButtonElement>("[data-place-focus='true']")
            ?.focus();
        pendingAddedPlaceFocusRef.current = null;
    }, [activeTab, places]);

    function handleTabChange(tab: TripTab) {
        if (tab === activeTab) {
            return;
        }

        setActiveTab(tab);
        setMapFocus(null);
    }

    function handleDayChange(day: TripDayKey) {
        setActiveDay(day);
        setMapFocus(null);
    }

    function handlePlaceSelect(placeId: string) {
        setMapFocus((currentFocus) => ({
            source: "schedule",
            placeId,
            request: (currentFocus?.request ?? 0) + 1,
        }));
    }

    function handleSearchPlaceSelect(place: PlaceSearchResult | null) {
        setMapFocus((currentFocus) =>
            place
                ? {
                      source: "search",
                      place,
                      request: (currentFocus?.request ?? 0) + 1,
                  }
                : null,
        );
    }

    function handleSearchPlaceAdd(result: PlaceSearchResult, day: ScheduleDay) {
        addedSearchPlaceSequenceRef.current += 1;
        const placeId = `search-${trip.id}-${addedSearchPlaceSequenceRef.current}`;

        pendingAddedPlaceFocusRef.current = placeId;
        setPlaces((currentPlaces) =>
            addSearchPlaceToSchedule(currentPlaces, {
                currencyCode: trip.currencyCode,
                day,
                id: placeId,
                result,
            }),
        );
        setActiveDay(day);
        setActiveTab("schedule");
        setMapFocus((currentFocus) => ({
            source: "schedule",
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

    function handlePlaceCostChange(placeId: string, cost: TripPlaceCost) {
        handlePlaceUpdate(placeId, { placeCost: cost });
    }

    function handlePlaceDelete(placeId: string) {
        setPlaces((currentPlaces) => deleteTripPlace(currentPlaces, placeId));
        setMapFocus((currentFocus) =>
            currentFocus?.source === "schedule" &&
            currentFocus.placeId === placeId
                ? null
                : currentFocus,
        );
    }

    function handlePlaceMove(placeId: string, day: ScheduleDay) {
        setPlaces((currentPlaces) =>
            moveTripPlace(currentPlaces, placeId, day),
        );
        setMapFocus((currentFocus) =>
            currentFocus?.source === "schedule" &&
            currentFocus.placeId === placeId
                ? null
                : currentFocus,
        );
    }

    return (
        <div className={styles.shell}>
            <TripNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
            <TripContentPanel
                title={panelTitles[activeTab]}
                hideTitle={
                    activeTab === "schedule" ||
                    activeTab === "search" ||
                    activeTab === "budget"
                }
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
                            selectedPlaceId={
                                mapFocus?.source === "schedule"
                                    ? mapFocus.placeId
                                    : null
                            }
                        />
                    </>
                ) : null}
                {activeTab === "search" ? (
                    <TripPlaceSearch
                        countryCode={trip.countryCode}
                        countryName={trip.country}
                        dayCount={tripDays.length}
                        defaultDay={activeDay}
                        onPlaceAdd={handleSearchPlaceAdd}
                        onPlaceSelect={handleSearchPlaceSelect}
                        searchCenter={searchHub?.coordinates}
                        searchRegion={searchHub?.region}
                        selectedPlaceId={
                            mapFocus?.source === "search"
                                ? mapFocus.place.id
                                : null
                        }
                    />
                ) : null}
                {activeTab === "budget" ? (
                    <TripBudget
                        activeDay={activeDay}
                        currencyCode={trip.currencyCode}
                        endDate={trip.endDate}
                        members={trip.members}
                        onDayChange={handleDayChange}
                        onInboundChange={handleInboundUpdate}
                        onPlaceCostChange={handlePlaceCostChange}
                        onTotalBudgetChange={setTotalBudgetAmount}
                        places={places}
                        startDate={trip.startDate}
                        totalBudgetAmount={totalBudgetAmount}
                    />
                ) : null}
            </TripContentPanel>
            <main className={`${styles.page} ${styles.mapPage}`}>
                <h1 className={styles.srOnly}>{trip.name}</h1>
                <TripMap
                    countryCode={trip.countryCode}
                    countryName={trip.country}
                    focusRequest={mapFocus?.request ?? 0}
                    focusedPlaceId={
                        mapFocus?.source === "schedule"
                            ? mapFocus.placeId
                            : null
                    }
                    onPlaceSelect={handlePlaceSelect}
                    places={activePlaces}
                    searchPlace={
                        activeTab === "search" && mapFocus?.source === "search"
                            ? mapFocus.place
                            : null
                    }
                />
            </main>
        </div>
    );
}
