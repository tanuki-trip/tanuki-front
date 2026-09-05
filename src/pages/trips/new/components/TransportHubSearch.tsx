import { Check, Search } from "lucide-react";
import { useId, useState } from "react";

import { getCountry, type CountryCode } from "../../../../trips/countries";
import type { HubTransportType } from "../../../../trips/transport";
import { searchTransportHubs } from "../../../../trips/transport-hubs";
import styles from "./style.module.css";

type TransportHubSearchProps = {
    name: string;
    countryCode: CountryCode;
    transportType: HubTransportType;
    searchLabel: string;
    selectedHubId: string | null;
    onChange: (hubId: string) => void;
};

export function TransportHubSearch({
    name,
    countryCode,
    transportType,
    searchLabel,
    selectedHubId,
    onChange,
}: TransportHubSearchProps) {
    const [query, setQuery] = useState("");
    const searchId = useId();
    const resultsId = useId();
    const country = getCountry(countryCode);
    const hubLabel = transportType === "flight" ? "공항" : "항구";
    const results = searchTransportHubs(countryCode, transportType, query);

    return (
        <div className={styles.hubSearchPanel}>
            <label className={styles.hubSearch} htmlFor={searchId}>
                <span>{searchLabel}</span>
                <div>
                    <Search aria-hidden="true" />
                    <input
                        id={searchId}
                        type="search"
                        autoComplete="off"
                        aria-controls={resultsId}
                        placeholder={`${country.name} 도시 또는 ${hubLabel} 검색`}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
            </label>

            <div className={styles.hubResults} id={resultsId}>
                <div className={styles.hubResultsHeader}>
                    <strong>
                        {query.trim()
                            ? `가까운 ${hubLabel}`
                            : `${country.name} 주요 ${hubLabel}`}
                    </strong>
                    <span role="status" aria-live="polite">
                        {results.length}개
                    </span>
                </div>
                {results.length ? (
                    <div
                        className={styles.hubResultList}
                        role="radiogroup"
                        aria-label={`${country.name} ${hubLabel} 선택`}
                    >
                        {results.map((hub) => (
                            <label className={styles.hubResult} key={hub.id}>
                                <input
                                    className={styles.choiceInput}
                                    type="radio"
                                    name={name}
                                    value={hub.id}
                                    checked={selectedHubId === hub.id}
                                    onChange={() => onChange(hub.id)}
                                />
                                <span className={styles.hubCode}>
                                    {hub.code}
                                </span>
                                <span className={styles.hubResultText}>
                                    <strong>{hub.name}</strong>
                                    <small>{hub.region}</small>
                                </span>
                                {selectedHubId === hub.id ? (
                                    <Check
                                        className={styles.hubCheck}
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyHubResults}>
                        검색 결과가 없습니다. 다른 지역이나 {hubLabel} 이름을
                        입력해보세요.
                    </p>
                )}
            </div>
        </div>
    );
}
