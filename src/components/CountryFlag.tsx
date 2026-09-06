import JapanFlag from "country-flag-icons/react/3x2/JP";
import SouthKoreaFlag from "country-flag-icons/react/3x2/KR";

import type { CountryCode } from "../trips/countries";

type CountryFlagProps = {
    code: CountryCode;
    className?: string;
};

const countryFlags = {
    JP: JapanFlag,
    KR: SouthKoreaFlag,
};

export function CountryFlag({ code, className }: CountryFlagProps) {
    const Flag = countryFlags[code];

    return <Flag className={className} aria-hidden="true" />;
}
