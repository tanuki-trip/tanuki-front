import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { getTripDayCount } from "../../../trips/new/trip-form";
import type { Trip, TripMember } from "../../../../trips/store";
import {
    defaultMapStyleId,
    mapStyleOptions,
    type MapStyleId,
} from "../../../../trips/map-style";
import {
    isHubTransportType,
    transportLabels,
    type TransportType,
} from "../../../../trips/transport";
import {
    findTransportHub,
    getTransportHubs,
} from "../../../../trips/transport-hubs";
import styles from "./TripSettings.module.css";

type TripSettingsProps = {
    expenseMemberIds: ReadonlySet<string>;
    onSave: (trip: Trip) => void;
    trip: Trip;
};

type TripSettingsDraft = {
    arrivalHubId: string;
    departureHubId: string;
    endDate: string;
    isDayTrip: boolean;
    mapStyle: MapStyleId;
    members: TripMember[];
    name: string;
    returnTransportType: TransportType;
    startDate: string;
    transportType: TransportType;
    usesDifferentReturn: boolean;
};

const transportOptions: readonly TransportType[] = ["flight", "ship", "other"];

function createDraft(trip: Trip): TripSettingsDraft {
    const returnTransportType = trip.returnTransportType ?? trip.transportType;
    const usesDifferentReturn =
        trip.transportType !== "other" &&
        (returnTransportType !== trip.transportType ||
            trip.departureHub?.id !== trip.arrivalHub?.id);

    return {
        arrivalHubId: trip.arrivalHub?.id ?? "",
        departureHubId: trip.departureHub?.id ?? "",
        endDate: trip.endDate,
        isDayTrip: trip.startDate === trip.endDate,
        mapStyle: trip.mapStyle ?? defaultMapStyleId,
        members: trip.members.map((member) => ({ ...member })),
        name: trip.name,
        returnTransportType,
        startDate: trip.startDate,
        transportType: trip.transportType,
        usesDifferentReturn,
    };
}

export function TripSettings({
    expenseMemberIds,
    onSave,
    trip,
}: TripSettingsProps) {
    const [draft, setDraft] = useState(() => createDraft(trip));
    const [message, setMessage] = useState("");
    const [hasError, setHasError] = useState(false);
    const arrivalHubs = isHubTransportType(draft.transportType)
        ? getTransportHubs(trip.countryCode, draft.transportType)
        : [];
    const departureHubs = isHubTransportType(draft.returnTransportType)
        ? getTransportHubs(trip.countryCode, draft.returnTransportType)
        : [];

    function setTransportType(transportType: TransportType) {
        setDraft((current) => ({
            ...current,
            arrivalHubId: "",
            departureHubId: "",
            returnTransportType: transportType,
            transportType,
            usesDifferentReturn: false,
        }));
        setMessage("");
    }

    function updateMember(memberId: string, name: string) {
        setDraft((current) => ({
            ...current,
            members: current.members.map((member) =>
                member.id === memberId ? { ...member, name } : member,
            ),
        }));
        setMessage("");
    }

    function addMember() {
        setDraft((current) => ({
            ...current,
            members: [
                ...current.members,
                { id: `member-${crypto.randomUUID()}`, name: "" },
            ],
        }));
        setMessage("");
    }

    function removeMember(memberId: string) {
        const member = draft.members.find(
            (candidate) => candidate.id === memberId,
        );

        if (expenseMemberIds.has(memberId)) {
            showError(
                `예산 내역에 포함된 동행은 삭제할 수 없습니다. ${member?.name || "이 동행"}의 정산 정보를 먼저 수정해 주세요.`,
            );
            return;
        }

        setDraft((current) => ({
            ...current,
            members: current.members.filter((member) => member.id !== memberId),
        }));
        setMessage("");
    }

    function showError(messageText: string) {
        setHasError(true);
        setMessage(messageText);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = draft.name.trim();
        const members = draft.members.map((member) => ({
            ...member,
            name: member.name.trim(),
        }));
        const dayCount = getTripDayCount(draft.startDate, draft.endDate);
        const arrivalHub = isHubTransportType(draft.transportType)
            ? findTransportHub(
                  trip.countryCode,
                  draft.transportType,
                  draft.arrivalHubId,
              )
            : undefined;

        if (!name) {
            showError("여행 이름을 입력해 주세요.");
            return;
        }
        if (dayCount === null) {
            showError("출발일보다 늦거나 같은 도착일을 선택해 주세요.");
            return;
        }
        if (members.length === 0 || members.some((member) => !member.name)) {
            showError("모든 여행자 이름을 입력해 주세요.");
            return;
        }
        if (isHubTransportType(draft.transportType) && !arrivalHub) {
            showError("여행지 공항 또는 항구를 선택해 주세요.");
            return;
        }

        const returnTransportType = draft.usesDifferentReturn
            ? draft.returnTransportType
            : draft.transportType;
        const departureHub = draft.usesDifferentReturn
            ? isHubTransportType(returnTransportType)
                ? findTransportHub(
                      trip.countryCode,
                      returnTransportType,
                      draft.departureHubId,
                  )
                : undefined
            : arrivalHub;

        if (
            draft.usesDifferentReturn &&
            isHubTransportType(returnTransportType) &&
            !departureHub
        ) {
            showError("돌아오는 공항 또는 항구를 선택해 주세요.");
            return;
        }

        onSave({
            ...trip,
            name,
            startDate: draft.startDate,
            endDate: draft.endDate,
            mapStyle: draft.mapStyle,
            members,
            transportType: draft.transportType,
            returnTransportType:
                draft.transportType === "other"
                    ? undefined
                    : returnTransportType,
            arrivalHub:
                draft.transportType === "other" ? undefined : arrivalHub,
            departureHub:
                draft.transportType === "other" ? undefined : departureHub,
        });
        setDraft((current) => ({ ...current, name, members }));
        setHasError(false);
        setMessage("여행 설정을 저장했습니다.");
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <section className={styles.section}>
                <h3>기본 정보</h3>
                <label className={styles.field}>
                    <span>여행 이름</span>
                    <input
                        type="text"
                        value={draft.name}
                        maxLength={60}
                        required
                        onChange={(event) => {
                            setDraft((current) => ({
                                ...current,
                                name: event.target.value,
                            }));
                            setMessage("");
                        }}
                    />
                </label>
                <div className={styles.readonlyField}>
                    <span>국가·통화</span>
                    <strong>
                        {trip.country} · {trip.currencyCode}
                    </strong>
                </div>
                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={draft.isDayTrip}
                        onChange={(event) => {
                            const isDayTrip = event.target.checked;

                            setDraft((current) => ({
                                ...current,
                                endDate: isDayTrip
                                    ? current.startDate
                                    : current.endDate,
                                isDayTrip,
                            }));
                            setMessage("");
                        }}
                    />
                    당일치기예요
                </label>
                <div className={styles.dateFields}>
                    <label className={styles.field}>
                        <span>출발일</span>
                        <input
                            type="date"
                            value={draft.startDate}
                            max={draft.endDate || undefined}
                            required
                            onChange={(event) => {
                                setDraft((current) => ({
                                    ...current,
                                    endDate: current.isDayTrip
                                        ? event.target.value
                                        : current.endDate,
                                    startDate: event.target.value,
                                }));
                                setMessage("");
                            }}
                        />
                    </label>
                    <label className={styles.field}>
                        <span>도착일</span>
                        <input
                            type="date"
                            value={draft.endDate}
                            min={draft.startDate || undefined}
                            disabled={draft.isDayTrip}
                            required
                            onChange={(event) => {
                                setDraft((current) => ({
                                    ...current,
                                    endDate: event.target.value,
                                }));
                                setMessage("");
                            }}
                        />
                    </label>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>여행 인원</h3>
                    <button type="button" onClick={addMember}>
                        <Plus aria-hidden="true" />
                        동행 추가
                    </button>
                </div>
                <div className={styles.memberFields}>
                    {draft.members.map((member, index) => (
                        <div className={styles.memberField} key={member.id}>
                            <label>
                                <span className={styles.srOnly}>
                                    {index === 0
                                        ? "본인 이름"
                                        : `동행 ${index} 이름`}
                                </span>
                                <input
                                    type="text"
                                    value={member.name}
                                    maxLength={30}
                                    placeholder={
                                        index === 0 ? "본인 이름" : "동행 이름"
                                    }
                                    required
                                    onChange={(event) =>
                                        updateMember(
                                            member.id,
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            {index > 0 ? (
                                <button
                                    type="button"
                                    aria-label={`${member.name || `동행 ${index}`} 삭제`}
                                    onClick={() => removeMember(member.id)}
                                >
                                    <Trash2 aria-hidden="true" />
                                </button>
                            ) : (
                                <span className={styles.ownerLabel}>본인</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <h3>이동 정보</h3>
                <label className={styles.field}>
                    <span>가는 교통수단</span>
                    <select
                        value={draft.transportType}
                        onChange={(event) =>
                            setTransportType(
                                event.target.value as TransportType,
                            )
                        }
                    >
                        {transportOptions.map((transportType) => (
                            <option key={transportType} value={transportType}>
                                {transportLabels[transportType]}
                            </option>
                        ))}
                    </select>
                </label>

                {isHubTransportType(draft.transportType) ? (
                    <label className={styles.field}>
                        <span>여행지 공항·항구</span>
                        <select
                            value={draft.arrivalHubId}
                            required
                            onChange={(event) => {
                                setDraft((current) => ({
                                    ...current,
                                    arrivalHubId: event.target.value,
                                }));
                                setMessage("");
                            }}
                        >
                            <option value="">선택해 주세요</option>
                            {arrivalHubs.map((hub) => (
                                <option key={hub.id} value={hub.id}>
                                    {hub.region} · {hub.name} ({hub.code})
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}

                {draft.transportType !== "other" ? (
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={draft.usesDifferentReturn}
                            onChange={(event) => {
                                setDraft((current) => ({
                                    ...current,
                                    departureHubId: "",
                                    returnTransportType: current.transportType,
                                    usesDifferentReturn: event.target.checked,
                                }));
                                setMessage("");
                            }}
                        />
                        돌아오는 편이 달라요
                    </label>
                ) : null}

                {draft.usesDifferentReturn ? (
                    <>
                        <label className={styles.field}>
                            <span>돌아오는 교통수단</span>
                            <select
                                value={draft.returnTransportType}
                                onChange={(event) => {
                                    setDraft((current) => ({
                                        ...current,
                                        departureHubId: "",
                                        returnTransportType: event.target
                                            .value as TransportType,
                                    }));
                                    setMessage("");
                                }}
                            >
                                {transportOptions.map((transportType) => (
                                    <option
                                        key={transportType}
                                        value={transportType}
                                    >
                                        {transportLabels[transportType]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {isHubTransportType(draft.returnTransportType) ? (
                            <label className={styles.field}>
                                <span>돌아오는 공항·항구</span>
                                <select
                                    value={draft.departureHubId}
                                    required
                                    onChange={(event) => {
                                        setDraft((current) => ({
                                            ...current,
                                            departureHubId: event.target.value,
                                        }));
                                        setMessage("");
                                    }}
                                >
                                    <option value="">선택해 주세요</option>
                                    {departureHubs.map((hub) => (
                                        <option key={hub.id} value={hub.id}>
                                            {hub.region} · {hub.name} (
                                            {hub.code})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                    </>
                ) : null}
            </section>

            <section className={styles.section}>
                <h3>지도</h3>
                <label className={styles.field}>
                    <span>지도 스타일</span>
                    <select
                        value={draft.mapStyle}
                        onChange={(event) => {
                            setDraft((current) => ({
                                ...current,
                                mapStyle: event.target.value as MapStyleId,
                            }));
                            setMessage("");
                        }}
                    >
                        {mapStyleOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </section>

            <div className={styles.saveArea}>
                <p
                    className={hasError ? styles.error : undefined}
                    aria-live="polite"
                >
                    {message}
                </p>
                <button className={styles.saveButton} type="submit">
                    설정 저장
                </button>
            </div>
        </form>
    );
}
