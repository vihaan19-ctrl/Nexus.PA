// Both of these are free, keyless public APIs — used so NEXUS can answer
// current-info questions honestly (with a timestamp + source) without
// needing a paid data subscription or fabricating numbers.

export async function lookupStock(symbol) {
  const sym = symbol.trim().toLowerCase();
  // Stooq free CSV quote endpoint. US tickers need a ".us" suffix.
  const query = /\.[a-z]+$/.test(sym) ? sym : `${sym}.us`;
  const res = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(query)}&f=sd2t2ohlcv&h&e=csv`);
  if (!res.ok) throw new Error("Stooq request failed");
  const csv = await res.text();
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("No data");
  const headers = lines[0].split(",");
  const values = lines[1].split(",");
  const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  if (!row.Close || row.Close === "N/D") throw new Error(`No data for symbol "${symbol}"`);
  return {
    symbol: row.Symbol,
    date: row.Date,
    time: row.Time,
    open: row.Open,
    high: row.High,
    low: row.Low,
    close: row.Close,
    volume: row.Volume,
    source: "stooq.com",
    fetchedAt: new Date().toISOString(),
  };
}

export async function lookupWeather(place) {
  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1`
  );
  if (!geo.ok) throw new Error("Geocoding request failed");
  const geoData = await geo.json();
  const loc = geoData?.results?.[0];
  if (!loc) throw new Error(`Couldn't find a location named "${place}"`);

  const wx = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
  );
  if (!wx.ok) throw new Error("Weather request failed");
  const wxData = await wx.json();
  return {
    place: [loc.name, loc.admin1, loc.country].filter(Boolean).join(", "),
    temperatureC: wxData.current?.temperature_2m,
    humidity: wxData.current?.relative_humidity_2m,
    windKmh: wxData.current?.wind_speed_10m,
    weatherCode: wxData.current?.weather_code,
    time: wxData.current?.time,
    source: "open-meteo.com",
    fetchedAt: new Date().toISOString(),
  };
}
