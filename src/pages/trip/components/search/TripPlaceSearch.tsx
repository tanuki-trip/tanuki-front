import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
    PlaceSearchError,
    searchPlaces,
    type PlaceSearchOptions,
    type PlaceSearchResult,
} from "../../../../places/search";
import type { CountryCode } from "../../../../trips/countries";
import styles from "./TripPlaceSearch.module.css";

type TripPlaceSearchProps = {
    countryCode: CountryCode;
    countryName: string;
    searchCenter?: PlaceSearchOptions["center"];
    searchRegion?: string;
    onPlaceSelect: (place: PlaceSearchResult | null) => void;
    selectedPlaceId?: string | null;
};

type SearchState =
    | { status: "idle" }
    | { status: "loading"; query: string }
    | { status: "success"; query: string; results: PlaceSearchResult[] }
    | { status: "empty"; query: string }
    | { status: "error"; message: string };

const requestTimeoutMs = 10_000;

function getSearchErrorMessage(error: unknown) {
    if (error instanceof PlaceSearchError && error.kind === "rate-limit") {
        return "검색 요청이 잠시 많아요. 잠시 후 다시 시도해 주세요.";
    }

    return "장소를 검색하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.";
}

export function TripPlaceSearch({
    countryCode,
    countryName,
    searchCenter,
    searchRegion,
    onPlaceSelect,
    selectedPlaceId = null,
}: TripPlaceSearchProps) {
    const [query, setQuery] = useState("");
    const [searchState, setSearchState] = useState<SearchState>({
        status: "idle",
    });
    const requestControllerRef = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            requestControllerRef.current?.abort();
        },
        [],
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const submittedQuery = query.trim();

        if (!submittedQuery) {
            setSearchState({
                status: "error",
                message: "검색할 장소명이나 주소를 입력해 주세요.",
            });
            return;
        }

        requestControllerRef.current?.abort();
        const controller = new AbortController();
        let timedOut = false;
        const timeout = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, requestTimeoutMs);

        requestControllerRef.current = controller;
        onPlaceSelect(null);
        setSearchState({ status: "loading", query: submittedQuery });

        try {
            const results = await searchPlaces(submittedQuery, countryCode, {
                center: searchCenter,
                region: searchRegion,
                signal: controller.signal,
            });

            if (requestControllerRef.current !== controller) {
                return;
            }

            setSearchState(
                results.length > 0
                    ? { status: "success", query: submittedQuery, results }
                    : { status: "empty", query: submittedQuery },
            );
        } catch (error) {
            if (
                controller.signal.aborted &&
                (!timedOut || requestControllerRef.current !== controller)
            ) {
                return;
            }

            setSearchState({
                status: "error",
                message: timedOut
                    ? "검색 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요."
                    : getSearchErrorMessage(error),
            });
        } finally {
            window.clearTimeout(timeout);

            if (requestControllerRef.current === controller) {
                requestControllerRef.current = null;
            }
        }
    }

    const statusMessageId = "trip-place-search-status";

    return (
        <section
            className={styles.root}
            aria-label={`${countryName} 장소 검색`}
        >
            <form className={styles.form} role="search" onSubmit={handleSubmit}>
                <label className={styles.label} htmlFor="trip-place-search">
                    장소명 또는 주소
                </label>
                <div className={styles.searchRow}>
                    <input
                        id="trip-place-search"
                        className={styles.input}
                        type="search"
                        name="place-search"
                        value={query}
                        maxLength={120}
                        autoComplete="off"
                        aria-describedby={statusMessageId}
                        placeholder={`${countryName}의 장소를 검색하세요`}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <button
                        className={styles.submit}
                        type="submit"
                        disabled={searchState.status === "loading"}
                    >
                        <Search aria-hidden="true" />
                        <span>검색</span>
                    </button>
                </div>
                <p className={styles.scope}>
                    검색 우선 지역 · {searchRegion ?? countryName}
                </p>
            </form>

            <div
                className={styles.resultsArea}
                id={statusMessageId}
                aria-live="polite"
            >
                {searchState.status === "idle" ? (
                    <p className={styles.feedback}>
                        한국어 장소명이나 주소를 입력한 뒤 검색해 보세요.
                    </p>
                ) : null}

                {searchState.status === "loading" ? (
                    <p className={styles.feedback} role="status">
                        ‘{searchState.query}’ 검색 중
                    </p>
                ) : null}

                {searchState.status === "empty" ? (
                    <p className={styles.feedback}>
                        ‘{searchState.query}’의 정확한 검색 결과가 없어요.
                        건물명이나 가까운 명소로 검색해 보세요.
                    </p>
                ) : null}

                {searchState.status === "error" ? (
                    <p
                        className={`${styles.feedback} ${styles.error}`}
                        role="alert"
                    >
                        {searchState.message}
                    </p>
                ) : null}

                {searchState.status === "success" ? (
                    <>
                        <p className={styles.resultSummary}>
                            ‘{searchState.query}’ 검색 결과{" "}
                            {searchState.results.length}개
                        </p>
                        <ol className={styles.results}>
                            {searchState.results.map((result) => (
                                <li className={styles.result} key={result.id}>
                                    <button
                                        className={styles.resultButton}
                                        type="button"
                                        aria-label={`지도에서 ${result.name} 보기`}
                                        aria-pressed={
                                            selectedPlaceId === result.id
                                        }
                                        data-selected={
                                            selectedPlaceId === result.id
                                                ? "true"
                                                : "false"
                                        }
                                        onClick={() => onPlaceSelect(result)}
                                    >
                                        <span
                                            className={styles.pin}
                                            aria-hidden="true"
                                        >
                                            <MapPin />
                                        </span>
                                        <span className={styles.resultText}>
                                            <strong>{result.name}</strong>
                                            <span>{result.address}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </>
                ) : null}
            </div>

            <p className={styles.attribution}>
                검색 데이터 ©{" "}
                <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                >
                    OpenStreetMap contributors
                </a>
                {countryCode === "JP" ? (
                    <>
                        {" · "}
                        <a
                            href="https://maps.gsi.go.jp/development/ichiran.html"
                            target="_blank"
                            rel="noreferrer"
                        >
                            国土地理院
                        </a>
                    </>
                ) : null}
            </p>
        </section>
    );
}
