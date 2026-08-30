export type AirportInfo = { icao: string; city: string; country: string; lat: number; lon: number };

const AIRPORTS: AirportInfo[] = [
  { icao: "EHAM", city: "Amsterdam", country: "Netherlands", lat: 52.3086, lon: 4.7639 },
  { icao: "EHRD", city: "Rotterdam", country: "Netherlands", lat: 51.9569, lon: 4.4372 },
  { icao: "EHEH", city: "Eindhoven", country: "Netherlands", lat: 51.4501, lon: 5.3745 },
  { icao: "EHGG", city: "Groningen", country: "Netherlands", lat: 53.1197, lon: 6.5794 },
  { icao: "EHBK", city: "Maastricht", country: "Netherlands", lat: 50.9117, lon: 5.7701 },
  { icao: "EHLE", city: "Lelystad", country: "Netherlands", lat: 52.4603, lon: 5.5272 },
  { icao: "EHTE", city: "Teuge", country: "Netherlands", lat: 52.2444, lon: 6.0467 },
  { icao: "EHTW", city: "Enschede", country: "Netherlands", lat: 52.27, lon: 6.8742 },
  { icao: "EHAL", city: "Ameland", country: "Netherlands", lat: 53.4517, lon: 5.6772 },
  { icao: "EHDR", city: "Drachten", country: "Netherlands", lat: 53.1192, lon: 6.1297 },
  { icao: "EHSE", city: "Breda", country: "Netherlands", lat: 51.555, lon: 4.5525 },
  { icao: "EHWO", city: "Woensdrecht", country: "Netherlands", lat: 51.4492, lon: 4.342 },
  { icao: "EHMZ", city: "Middelburg", country: "Netherlands", lat: 51.5122, lon: 3.7311 },
  { icao: "EBOS", city: "Ostend", country: "Belgium", lat: 51.1989, lon: 2.8622 },
  { icao: "EBLG", city: "Liege", country: "Belgium", lat: 50.6374, lon: 5.4432 },
  { icao: "EBBR", city: "Brussels", country: "Belgium", lat: 50.9014, lon: 4.4844 },
  { icao: "EDDF", city: "Frankfurt", country: "Germany", lat: 50.0379, lon: 8.5622 },
  { icao: "EDDM", city: "Munich", country: "Germany", lat: 48.3538, lon: 11.7861 },
  { icao: "EDDB", city: "Berlin", country: "Germany", lat: 52.3667, lon: 13.5033 },
  { icao: "EDDH", city: "Hamburg", country: "Germany", lat: 53.6304, lon: 9.9882 },
  { icao: "EDDL", city: "Dusseldorf", country: "Germany", lat: 51.2895, lon: 6.7668 },
  { icao: "LFPG", city: "Paris", country: "France", lat: 49.0097, lon: 2.5478 },
  { icao: "LFPO", city: "Paris", country: "France", lat: 48.7233, lon: 2.3794 },
  { icao: "LFMN", city: "Nice", country: "France", lat: 43.6584, lon: 7.2159 },
  { icao: "EGLL", city: "London", country: "United Kingdom", lat: 51.47, lon: -0.4543 },
  { icao: "EGKK", city: "London", country: "United Kingdom", lat: 51.1481, lon: -0.1903 },
  { icao: "EGCC", city: "Manchester", country: "United Kingdom", lat: 53.3537, lon: -2.275 },
  { icao: "EIDW", city: "Dublin", country: "Ireland", lat: 53.4213, lon: -6.2701 },
  { icao: "LEMD", city: "Madrid", country: "Spain", lat: 40.4983, lon: -3.5676 },
  { icao: "LEBL", city: "Barcelona", country: "Spain", lat: 41.2971, lon: 2.0785 },
  { icao: "LPPT", city: "Lisbon", country: "Portugal", lat: 38.7742, lon: -9.1342 },
  { icao: "LIRF", city: "Rome", country: "Italy", lat: 41.8003, lon: 12.2389 },
  { icao: "LIMC", city: "Milan", country: "Italy", lat: 45.6306, lon: 8.7281 },
  { icao: "LSZH", city: "Zurich", country: "Switzerland", lat: 47.4582, lon: 8.5555 },
  { icao: "LOWW", city: "Vienna", country: "Austria", lat: 48.1103, lon: 16.5697 },
  { icao: "EKCH", city: "Copenhagen", country: "Denmark", lat: 55.618, lon: 12.656 },
  { icao: "ENGM", city: "Oslo", country: "Norway", lat: 60.1939, lon: 11.1004 },
  { icao: "ESSA", city: "Stockholm", country: "Sweden", lat: 59.6519, lon: 17.9186 },
  { icao: "EFHK", city: "Helsinki", country: "Finland", lat: 60.3172, lon: 24.9633 },
  { icao: "EPWA", city: "Warsaw", country: "Poland", lat: 52.1657, lon: 20.9671 },
  { icao: "LKPR", city: "Prague", country: "Czechia", lat: 50.1008, lon: 14.26 },
  { icao: "LHBP", city: "Budapest", country: "Hungary", lat: 47.4369, lon: 19.2556 },
  { icao: "LROP", city: "Bucharest", country: "Romania", lat: 44.5711, lon: 26.085 },
  { icao: "LBSF", city: "Sofia", country: "Bulgaria", lat: 42.6967, lon: 23.4114 },
  { icao: "LGAV", city: "Athens", country: "Greece", lat: 37.9364, lon: 23.9445 },
  { icao: "LTBA", city: "Istanbul", country: "Turkey", lat: 40.9769, lon: 28.8146 },
  { icao: "LTFM", city: "Istanbul", country: "Turkey", lat: 41.2753, lon: 28.7519 },
  { icao: "OMDB", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  { icao: "OTHH", city: "Doha", country: "Qatar", lat: 25.2731, lon: 51.6081 },
  { icao: "OEJN", city: "Jeddah", country: "Saudi Arabia", lat: 21.6796, lon: 39.1565 },
  { icao: "FACT", city: "Cape Town", country: "South Africa", lat: -33.9648, lon: 18.6017 },
  { icao: "FAOR", city: "Johannesburg", country: "South Africa", lat: -26.1392, lon: 28.246 },
  { icao: "HECA", city: "Cairo", country: "Egypt", lat: 30.1219, lon: 31.4056 },
  { icao: "KJFK", city: "New York", country: "United States", lat: 40.6413, lon: -73.7781 },
  { icao: "KEWR", city: "Newark", country: "United States", lat: 40.6925, lon: -74.1687 },
  { icao: "KLAX", city: "Los Angeles", country: "United States", lat: 33.9416, lon: -118.4085 },
  { icao: "KORD", city: "Chicago", country: "United States", lat: 41.9742, lon: -87.9073 },
  { icao: "KATL", city: "Atlanta", country: "United States", lat: 33.6407, lon: -84.4277 },
  { icao: "KDFW", city: "Dallas", country: "United States", lat: 32.8998, lon: -97.0403 },
  { icao: "KDEN", city: "Denver", country: "United States", lat: 39.8561, lon: -104.6737 },
  { icao: "KSFO", city: "San Francisco", country: "United States", lat: 37.6213, lon: -122.379 },
  { icao: "KSEA", city: "Seattle", country: "United States", lat: 47.4502, lon: -122.3088 },
  { icao: "KMIA", city: "Miami", country: "United States", lat: 25.7959, lon: -80.287 },
  { icao: "KMCO", city: "Orlando", country: "United States", lat: 28.4312, lon: -81.3081 },
  { icao: "KBOS", city: "Boston", country: "United States", lat: 42.3656, lon: -71.0096 },
  { icao: "KIAD", city: "Washington", country: "United States", lat: 38.9531, lon: -77.4565 },
  { icao: "CYYZ", city: "Toronto", country: "Canada", lat: 43.6777, lon: -79.6248 },
  { icao: "CYVR", city: "Vancouver", country: "Canada", lat: 49.1947, lon: -123.179 },
  { icao: "MMMX", city: "Mexico City", country: "Mexico", lat: 19.4363, lon: -99.0721 },
  { icao: "SBGR", city: "Sao Paulo", country: "Brazil", lat: -23.4356, lon: -46.4731 },
  { icao: "SBGL", city: "Rio de Janeiro", country: "Brazil", lat: -22.809, lon: -43.2506 },
  { icao: "SAEZ", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lon: -58.5358 },
  { icao: "SCEL", city: "Santiago", country: "Chile", lat: -33.393, lon: -70.7858 },
  { icao: "SKBO", city: "Bogota", country: "Colombia", lat: 4.7016, lon: -74.1469 },
  { icao: "RJTT", city: "Tokyo", country: "Japan", lat: 35.5533, lon: 139.7811 },
  { icao: "RJAA", city: "Tokyo", country: "Japan", lat: 35.7647, lon: 140.3864 },
  { icao: "RJBB", city: "Osaka", country: "Japan", lat: 34.4342, lon: 135.2328 },
  { icao: "RKSI", city: "Seoul", country: "South Korea", lat: 37.4602, lon: 126.4407 },
  { icao: "VHHH", city: "Hong Kong", country: "Hong Kong", lat: 22.308, lon: 113.9185 },
  { icao: "WSSS", city: "Singapore", country: "Singapore", lat: 1.3644, lon: 103.9915 },
  { icao: "WMKK", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lon: 101.7099 },
  { icao: "VTBS", city: "Bangkok", country: "Thailand", lat: 13.69, lon: 100.7501 },
  { icao: "WIII", city: "Jakarta", country: "Indonesia", lat: -6.1256, lon: 106.6558 },
  { icao: "RPLL", city: "Manila", country: "Philippines", lat: 14.5086, lon: 121.0198 },
  { icao: "YSSY", city: "Sydney", country: "Australia", lat: -33.9399, lon: 151.1753 },
  { icao: "YMML", city: "Melbourne", country: "Australia", lat: -37.6733, lon: 144.8433 },
  { icao: "ZBAA", city: "Beijing", country: "China", lat: 40.08, lon: 116.5844 },
  { icao: "ZSPD", city: "Shanghai", country: "China", lat: 31.1434, lon: 121.8052 },
  { icao: "ZGGG", city: "Guangzhou", country: "China", lat: 23.3924, lon: 113.2988 },
  { icao: "VIDP", city: "Delhi", country: "India", lat: 28.5562, lon: 77.1 },
  { icao: "VABB", city: "Mumbai", country: "India", lat: 19.0887, lon: 72.8679 },
  { icao: "NZAA", city: "Auckland", country: "New Zealand", lat: -37.0082, lon: 174.785 },
];

function distKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(s));
}

export function nearestAirport(lat: number, lon: number, maxKm = 45): AirportInfo | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let best: AirportInfo | null = null;
  let bestD = maxKm;
  for (const ap of AIRPORTS) {
    const d = distKm(lat, lon, ap.lat, ap.lon);
    if (d < bestD) {
      bestD = d;
      best = ap;
    }
  }
  return best;
}

export function airportLine(ap: AirportInfo | null): string {
  if (!ap) return "";
  return `${ap.icao} · ${ap.city}, ${ap.country}`;
}
