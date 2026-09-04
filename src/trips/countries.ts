export const supportedCountries = [
    {
        code: "JP",
        name: "일본",
        englishName: "Japan",
        currencyCode: "JPY",
        currencyName: "엔",
    },
    {
        code: "VN",
        name: "베트남",
        englishName: "Vietnam",
        currencyCode: "VND",
        currencyName: "동",
    },
    {
        code: "CN",
        name: "중국",
        englishName: "China",
        currencyCode: "CNY",
        currencyName: "위안",
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
