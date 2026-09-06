export const supportedCountries = [
    {
        code: "KR",
        name: "한국",
        englishName: "South Korea",
        currencyCode: "KRW",
        currencyName: "원",
    },
    {
        code: "JP",
        name: "일본",
        englishName: "Japan",
        currencyCode: "JPY",
        currencyName: "엔",
    },
] as const;

export type Country = (typeof supportedCountries)[number];
export type CountryCode = (typeof supportedCountries)[number]["code"];

export function getCountry(countryCode: CountryCode): Country {
    const country = supportedCountries.find(({ code }) => code === countryCode);

    if (!country) {
        throw new Error(`Unsupported country code: ${countryCode}`);
    }

    return country;
}
