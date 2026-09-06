import { Check } from "lucide-react";

import { CountryFlag } from "../../../../components/CountryFlag";
import {
    supportedCountries,
    type CountryCode,
} from "../../../../trips/countries";
import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

type CountryStepProps = {
    countryCode: CountryCode | null;
    headingRef: StepHeadingRef;
    onChange: (countryCode: CountryCode) => void;
};

export function CountryStep({
    countryCode,
    headingRef,
    onChange,
}: CountryStepProps) {
    return (
        <section>
            <StepHeader
                title="어디로 떠나나요?"
                description="여행할 국가를 선택해주세요."
                headingRef={headingRef}
            />
            <fieldset className={styles.choiceFieldset}>
                <legend className={styles.srOnly}>여행 국가</legend>
                <div className={styles.countryList}>
                    {supportedCountries.map((country) => (
                        <label
                            className={styles.countryOption}
                            key={country.code}
                        >
                            <input
                                className={styles.choiceInput}
                                type="radio"
                                name="country"
                                value={country.code}
                                checked={countryCode === country.code}
                                onChange={() => onChange(country.code)}
                            />
                            <CountryFlag
                                className={styles.flag}
                                code={country.code}
                            />
                            <span className={styles.countryText}>
                                <strong>{country.name}</strong>
                                <span>
                                    {country.currencyCode} ·{" "}
                                    {country.currencyName}
                                </span>
                            </span>
                            {countryCode === country.code ? (
                                <Check
                                    className={styles.countryCheck}
                                    aria-hidden="true"
                                />
                            ) : null}
                        </label>
                    ))}
                </div>
            </fieldset>
        </section>
    );
}
