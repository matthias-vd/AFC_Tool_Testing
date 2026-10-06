/** Dial codes longest-first so "1242" beats "1". */
export const DIAL_CODES: Array<{ code: string; flag: string; label: string }> = [
  { code: "1242", flag: "🇧🇸", label: "Bahama's" },
  { code: "1246", flag: "🇧🇧", label: "Barbados" },
  { code: "1264", flag: "🇦🇮", label: "Anguilla" },
  { code: "1268", flag: "🇦🇬", label: "Antigua" },
  { code: "1284", flag: "🇻🇬", label: "BVI" },
  { code: "1340", flag: "🇻🇮", label: "US Virgin Islands" },
  { code: "1441", flag: "🇧🇲", label: "Bermuda" },
  { code: "1473", flag: "🇬🇩", label: "Grenada" },
  { code: "1649", flag: "🇹🇨", label: "Turks & Caicos" },
  { code: "1664", flag: "🇲🇸", label: "Montserrat" },
  { code: "1671", flag: "🇬🇺", label: "Guam" },
  { code: "1684", flag: "🇦🇸", label: "American Samoa" },
  { code: "1758", flag: "🇱🇨", label: "Saint Lucia" },
  { code: "1767", flag: "🇩🇲", label: "Dominica" },
  { code: "1784", flag: "🇻🇨", label: "Saint Vincent" },
  { code: "1787", flag: "🇵🇷", label: "Puerto Rico" },
  { code: "1809", flag: "🇩🇴", label: "Dominicaanse Rep." },
  { code: "1868", flag: "🇹🇹", label: "Trinidad" },
  { code: "1869", flag: "🇰🇳", label: "Saint Kitts" },
  { code: "1876", flag: "🇯🇲", label: "Jamaica" },
  { code: "358", flag: "🇫🇮", label: "Finland" },
  { code: "353", flag: "🇮🇪", label: "Ierland" },
  { code: "352", flag: "🇱🇺", label: "Luxemburg" },
  { code: "351", flag: "🇵🇹", label: "Portugal" },
  { code: "420", flag: "🇨🇿", label: "Tsjechië" },
  { code: "421", flag: "🇸🇰", label: "Slowakije" },
  { code: "372", flag: "🇪🇪", label: "Estland" },
  { code: "371", flag: "🇱🇻", label: "Letland" },
  { code: "370", flag: "🇱🇹", label: "Litouwen" },
  { code: "386", flag: "🇸🇮", label: "Slovenië" },
  { code: "385", flag: "🇭🇷", label: "Kroatië" },
  { code: "359", flag: "🇧🇬", label: "Bulgarije" },
  { code: "357", flag: "🇨🇾", label: "Cyprus" },
  { code: "356", flag: "🇲🇹", label: "Malta" },
  { code: "354", flag: "🇮🇸", label: "IJsland" },
  { code: "381", flag: "🇷🇸", label: "Servië" },
  { code: "382", flag: "🇲🇪", label: "Montenegro" },
  { code: "383", flag: "🇽🇰", label: "Kosovo" },
  { code: "389", flag: "🇲🇰", label: "Noord-Macedonië" },
  { code: "355", flag: "🇦🇱", label: "Albanië" },
  { code: "373", flag: "🇲🇩", label: "Moldavië" },
  { code: "374", flag: "🇦🇲", label: "Armenië" },
  { code: "375", flag: "🇧🇾", label: "Wit-Rusland" },
  { code: "380", flag: "🇺🇦", label: "Oekraïne" },
  { code: "995", flag: "🇬🇪", label: "Georgië" },
  { code: "994", flag: "🇦🇿", label: "Azerbeidzjan" },
  { code: "992", flag: "🇹🇯", label: "Tadzjikistan" },
  { code: "998", flag: "🇺🇿", label: "Oezbekistan" },
  { code: "996", flag: "🇰🇬", label: "Kirgizië" },
  { code: "993", flag: "🇹🇲", label: "Turkmenistan" },
  { code: "977", flag: "🇳🇵", label: "Nepal" },
  { code: "975", flag: "🇧🇹", label: "Bhutan" },
  { code: "974", flag: "🇶🇦", label: "Qatar" },
  { code: "973", flag: "🇧🇭", label: "Bahrein" },
  { code: "972", flag: "🇮🇱", label: "Israël" },
  { code: "971", flag: "🇦🇪", label: "VAE" },
  { code: "968", flag: "🇴🇲", label: "Oman" },
  { code: "967", flag: "🇾🇪", label: "Jemen" },
  { code: "966", flag: "🇸🇦", label: "Saoedi-Arabië" },
  { code: "965", flag: "🇰🇼", label: "Koeweit" },
  { code: "964", flag: "🇮🇶", label: "Irak" },
  { code: "963", flag: "🇸🇾", label: "Syrië" },
  { code: "962", flag: "🇯🇴", label: "Jordanië" },
  { code: "961", flag: "🇱🇧", label: "Libanon" },
  { code: "960", flag: "🇲🇻", label: "Maldiven" },
  { code: "886", flag: "🇹🇼", label: "Taiwan" },
  { code: "880", flag: "🇧🇩", label: "Bangladesh" },
  { code: "856", flag: "🇱🇦", label: "Laos" },
  { code: "855", flag: "🇰🇭", label: "Cambodja" },
  { code: "853", flag: "🇲🇴", label: "Macau" },
  { code: "852", flag: "🇭🇰", label: "Hongkong" },
  { code: "850", flag: "🇰🇵", label: "Noord-Korea" },
  { code: "670", flag: "🇹🇱", label: "Oost-Timor" },
  { code: "679", flag: "🇫🇯", label: "Fiji" },
  { code: "678", flag: "🇻🇺", label: "Vanuatu" },
  { code: "677", flag: "🇸🇧", label: "Salomonseilanden" },
  { code: "676", flag: "🇹🇴", label: "Tonga" },
  { code: "675", flag: "🇵🇬", label: "Papoea-Nieuw-Guinea" },
  { code: "674", flag: "🇳🇷", label: "Nauru" },
  { code: "673", flag: "🇧🇳", label: "Brunei" },
  { code: "672", flag: "🇳🇫", label: "Norfolk" },
  { code: "691", flag: "🇫🇲", label: "Micronesië" },
  { code: "692", flag: "🇲🇭", label: "Marshalleilanden" },
  { code: "680", flag: "🇵🇼", label: "Palau" },
  { code: "687", flag: "🇳🇨", label: "Nieuw-Caledonië" },
  { code: "689", flag: "🇵🇫", label: "Frans-Polynesië" },
  { code: "598", flag: "🇺🇾", label: "Uruguay" },
  { code: "597", flag: "🇸🇷", label: "Suriname" },
  { code: "595", flag: "🇵🇾", label: "Paraguay" },
  { code: "593", flag: "🇪🇨", label: "Ecuador" },
  { code: "592", flag: "🇬🇾", label: "Guyana" },
  { code: "591", flag: "🇧🇴", label: "Bolivia" },
  { code: "509", flag: "🇭🇹", label: "Haïti" },
  { code: "507", flag: "🇵🇦", label: "Panama" },
  { code: "506", flag: "🇨🇷", label: "Costa Rica" },
  { code: "505", flag: "🇳🇮", label: "Nicaragua" },
  { code: "504", flag: "🇭🇳", label: "Honduras" },
  { code: "503", flag: "🇸🇻", label: "El Salvador" },
  { code: "502", flag: "🇬🇹", label: "Guatemala" },
  { code: "501", flag: "🇧🇿", label: "Belize" },
  { code: "249", flag: "🇸🇩", label: "Soedan" },
  { code: "251", flag: "🇪🇹", label: "Ethiopië" },
  { code: "252", flag: "🇸🇴", label: "Somalië" },
  { code: "253", flag: "🇩🇯", label: "Djibouti" },
  { code: "254", flag: "🇰🇪", label: "Kenia" },
  { code: "255", flag: "🇹🇿", label: "Tanzania" },
  { code: "256", flag: "🇺🇬", label: "Oeganda" },
  { code: "257", flag: "🇧🇮", label: "Burundi" },
  { code: "258", flag: "🇲🇿", label: "Mozambique" },
  { code: "260", flag: "🇿🇲", label: "Zambia" },
  { code: "261", flag: "🇲🇬", label: "Madagaskar" },
  { code: "262", flag: "🇷🇪", label: "Réunion" },
  { code: "263", flag: "🇿🇼", label: "Zimbabwe" },
  { code: "264", flag: "🇳🇦", label: "Namibië" },
  { code: "265", flag: "🇲🇼", label: "Malawi" },
  { code: "266", flag: "🇱🇸", label: "Lesotho" },
  { code: "267", flag: "🇧🇼", label: "Botswana" },
  { code: "268", flag: "🇸🇿", label: "Eswatini" },
  { code: "269", flag: "🇰🇲", label: "Comoren" },
  { code: "290", flag: "🇸🇭", label: "Sint-Helena" },
  { code: "291", flag: "🇪🇷", label: "Eritrea" },
  { code: "297", flag: "🇦🇼", label: "Aruba" },
  { code: "298", flag: "🇫🇴", label: "Faeröer" },
  { code: "299", flag: "🇬🇱", label: "Groenland" },
  { code: "212", flag: "🇲🇦", label: "Marokko" },
  { code: "213", flag: "🇩🇿", label: "Algerije" },
  { code: "216", flag: "🇹🇳", label: "Tunesië" },
  { code: "218", flag: "🇱🇾", label: "Libië" },
  { code: "220", flag: "🇬🇲", label: "Gambia" },
  { code: "221", flag: "🇸🇳", label: "Senegal" },
  { code: "222", flag: "🇲🇷", label: "Mauritanië" },
  { code: "223", flag: "🇲🇱", label: "Mali" },
  { code: "224", flag: "🇬🇳", label: "Guinee" },
  { code: "225", flag: "🇨🇮", label: "Ivoorkust" },
  { code: "226", flag: "🇧🇫", label: "Burkina Faso" },
  { code: "227", flag: "🇳🇪", label: "Niger" },
  { code: "228", flag: "🇹🇬", label: "Togo" },
  { code: "229", flag: "🇧🇯", label: "Benin" },
  { code: "230", flag: "🇲🇺", label: "Mauritius" },
  { code: "231", flag: "🇱🇷", label: "Liberia" },
  { code: "232", flag: "🇸🇱", label: "Sierra Leone" },
  { code: "233", flag: "🇬🇭", label: "Ghana" },
  { code: "234", flag: "🇳🇬", label: "Nigeria" },
  { code: "235", flag: "🇹🇩", label: "Tsjaad" },
  { code: "236", flag: "🇨🇫", label: "Centraal-Afrika" },
  { code: "237", flag: "🇨🇲", label: "Kameroen" },
  { code: "238", flag: "🇨🇻", label: "Kaapverdië" },
  { code: "239", flag: "🇸🇹", label: "Sao Tomé" },
  { code: "240", flag: "🇬🇶", label: "Equatoriaal-Guinea" },
  { code: "241", flag: "🇬🇦", label: "Gabon" },
  { code: "242", flag: "🇨🇬", label: "Congo-Brazzaville" },
  { code: "243", flag: "🇨🇩", label: "Congo-Kinshasa" },
  { code: "244", flag: "🇦🇴", label: "Angola" },
  { code: "245", flag: "🇬🇼", label: "Guinee-Bissau" },
  { code: "248", flag: "🇸🇨", label: "Seychellen" },
  { code: "250", flag: "🇷🇼", label: "Rwanda" },
  { code: "27", flag: "🇿🇦", label: "Zuid-Afrika" },
  { code: "20", flag: "🇪🇬", label: "Egypte" },
  { code: "98", flag: "🇮🇷", label: "Iran" },
  { code: "95", flag: "🇲🇲", label: "Myanmar" },
  { code: "94", flag: "🇱🇰", label: "Sri Lanka" },
  { code: "93", flag: "🇦🇫", label: "Afghanistan" },
  { code: "92", flag: "🇵🇰", label: "Pakistan" },
  { code: "91", flag: "🇮🇳", label: "India" },
  { code: "90", flag: "🇹🇷", label: "Turkije" },
  { code: "86", flag: "🇨🇳", label: "China" },
  { code: "84", flag: "🇻🇳", label: "Vietnam" },
  { code: "82", flag: "🇰🇷", label: "Zuid-Korea" },
  { code: "81", flag: "🇯🇵", label: "Japan" },
  { code: "66", flag: "🇹🇭", label: "Thailand" },
  { code: "65", flag: "🇸🇬", label: "Singapore" },
  { code: "64", flag: "🇳🇿", label: "Nieuw-Zeeland" },
  { code: "63", flag: "🇵🇭", label: "Filipijnen" },
  { code: "62", flag: "🇮🇩", label: "Indonesië" },
  { code: "61", flag: "🇦🇺", label: "Australië" },
  { code: "60", flag: "🇲🇾", label: "Maleisië" },
  { code: "58", flag: "🇻🇪", label: "Venezuela" },
  { code: "57", flag: "🇨🇴", label: "Colombia" },
  { code: "56", flag: "🇨🇱", label: "Chili" },
  { code: "55", flag: "🇧🇷", label: "Brazilië" },
  { code: "54", flag: "🇦🇷", label: "Argentinië" },
  { code: "53", flag: "🇨🇺", label: "Cuba" },
  { code: "52", flag: "🇲🇽", label: "Mexico" },
  { code: "51", flag: "🇵🇪", label: "Peru" },
  { code: "49", flag: "🇩🇪", label: "Duitsland" },
  { code: "48", flag: "🇵🇱", label: "Polen" },
  { code: "47", flag: "🇳🇴", label: "Noorwegen" },
  { code: "46", flag: "🇸🇪", label: "Zweden" },
  { code: "45", flag: "🇩🇰", label: "Denemarken" },
  { code: "44", flag: "🇬🇧", label: "Verenigd Koninkrijk" },
  { code: "43", flag: "🇦🇹", label: "Oostenrijk" },
  { code: "41", flag: "🇨🇭", label: "Zwitserland" },
  { code: "40", flag: "🇷🇴", label: "Roemenië" },
  { code: "39", flag: "🇮🇹", label: "Italië" },
  { code: "36", flag: "🇭🇺", label: "Hongarije" },
  { code: "34", flag: "🇪🇸", label: "Spanje" },
  { code: "33", flag: "🇫🇷", label: "Frankrijk" },
  { code: "32", flag: "🇧🇪", label: "België" },
  { code: "31", flag: "🇳🇱", label: "Nederland" },
  { code: "30", flag: "🇬🇷", label: "Griekenland" },
  { code: "7", flag: "🇷🇺", label: "Rusland/Kazachstan" },
  { code: "1", flag: "🇺🇸", label: "VS/Canada" },
];

export const DEFAULT_PHONE_PREFIX = "+32 4";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function detectDialCode(digits: string) {
  for (const entry of DIAL_CODES) {
    if (digits.startsWith(entry.code)) {
      return entry;
    }
  }
  return null;
}

function groupDigits(value: string, pattern: number[]) {
  const parts: string[] = [];
  let index = 0;
  for (const size of pattern) {
    if (index >= value.length) break;
    parts.push(value.slice(index, index + size));
    index += size;
  }
  if (index < value.length) {
    parts.push(value.slice(index));
  }
  return parts.filter(Boolean).join(" ");
}

/** Format an international phone string for display while typing. */
export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  if (!trimmed) return "";

  // Allow the user to clear the Belgian default entirely.
  if (trimmed === "+" || trimmed === "00") return trimmed;

  const hasPlus = trimmed.startsWith("+");
  let digits = digitsOnly(trimmed);
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (!digits) {
    return hasPlus ? "+" : "";
  }

  const match = detectDialCode(digits);
  if (!match) {
    const rest = digits.slice(0, 15);
    return `${hasPlus || trimmed.startsWith("00") ? "+" : ""}${groupDigits(rest, [3, 3, 3, 3])}`;
  }

  const national = digits.slice(match.code.length).slice(0, 12);
  if (match.code === "32") {
    // Belgian mobiles: 4xx xx xx xx
    if (national.startsWith("4")) {
      return `+32 ${groupDigits(national, [3, 2, 2, 2])}`;
    }
    return `+32 ${groupDigits(national, [1, 3, 2, 2, 2])}`;
  }

  if (match.code === "31") {
    return `+31 ${groupDigits(national, [1, 4, 2, 2])}`;
  }

  if (match.code === "1") {
    return `+1 ${groupDigits(national, [3, 3, 4])}`;
  }

  return `+${match.code}${national ? ` ${groupDigits(national, [3, 3, 3, 3])}` : ""}`;
}

export function phoneFlag(value: string): { flag: string; label: string } {
  let digits = digitsOnly(value);
  if (digits.startsWith("00")) digits = digits.slice(2);
  const match = detectDialCode(digits);
  if (match) {
    return { flag: match.flag, label: match.label };
  }
  return { flag: "🌐", label: "Internationaal" };
}
