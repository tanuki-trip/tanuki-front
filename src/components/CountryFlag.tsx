import ChinaFlag from "country-flag-icons/react/3x2/CN";
import JapanFlag from "country-flag-icons/react/3x2/JP";
import VietnamFlag from "country-flag-icons/react/3x2/VN";

import type { CountryCode } from "../trips/countries";

type CountryFlagProps = {
    code: CountryCode;
    className?: string;
};

const countryFlags = {
    CN: ChinaFlag,
    JP: JapanFlag,
    VN: VietnamFlag,
};

export function CountryFlag({ code, className }: CountryFlagProps) {
    const Flag = countryFlags[code];

    return <Flag className={className} aria-hidden="true" />;
}
