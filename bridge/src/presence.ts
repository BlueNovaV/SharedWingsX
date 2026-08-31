/** Body-frame seat offsets (metres: +X right, +Y up, +Z forward) to world lat/lon/alt. */

export function bodyOffsetToWorld(
  lat: number,
  lon: number,
  altFt: number,
  pitchDeg: number,
  bankDeg: number,
  headingDeg: number,
  x: number,
  y: number,
  z: number,
): { lat: number; lon: number; alt: number; heading: number; pitch: number; bank: number } {
  const h = (headingDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const b = (bankDeg * Math.PI) / 180;
  const cosH = Math.cos(h);
  const sinH = Math.sin(h);
  const cosP = Math.cos(p);
  const sinP = Math.sin(p);
  const cosB = Math.cos(b);
  const sinB = Math.sin(b);
  const north =
    cosH * cosP * z + (cosH * sinP * sinB - sinH * cosB) * x + (cosH * sinP * cosB + sinH * sinB) * y;
  const east =
    sinH * cosP * z + (sinH * sinP * sinB + cosH * cosB) * x + (sinH * sinP * cosB - cosH * sinB) * y;
  const up = -sinP * z + cosP * sinB * x + cosP * cosB * y;
  const latRad = (lat * Math.PI) / 180;
  const mLat = 111132.954 - 559.822 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const mLon = (Math.PI / 180) * 6378137 * Math.cos(latRad);
  return {
    lat: lat + north / mLat,
    lon: lon + east / Math.max(1, mLon),
    alt: altFt + up * 3.280839895,
    heading: headingDeg,
    pitch: pitchDeg,
    bank: bankDeg,
  };
}
