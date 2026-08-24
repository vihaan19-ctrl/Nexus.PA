const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8787";

export interface WebQueryResult { text: string; source: string; query: string }

export async function tryWebQuery(text: string): Promise<WebQueryResult | null> {
  const stockMatch = text.match(/\b([A-Z]{1,5})\b\s+stock|stock\s+(?:price\s+)?(?:of|for)?\s*([A-Za-z]{1,5})\b|what.?s\s+([A-Za-z]{2,5})\s+stock\s+doing/i);
  if (stockMatch || /\bstock\b/i.test(text)) {
    const symbol = extractSymbol(text);
    if (symbol) {
      try {
        const res = await fetch(`${AI_BACKEND_URL}/api/web/stock?symbol=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        if (!res.ok) return { text: `Couldn't get a quote for ${symbol.toUpperCase()}: ${data.error}`, source: "stooq.com", query: text };
        return {
          text: `${data.symbol}: ${data.close} (open ${data.open}, high ${data.high}, low ${data.low}) as of ${data.date} ${data.time}.`,
          source: `stooq.com, fetched ${new Date(data.fetchedAt).toLocaleTimeString()}`,
          query: text,
        };
      } catch {
        return { text: "Couldn't reach the stock data backend — make sure the server in /server is running.", source: "error", query: text };
      }
    }
  }

  const weatherMatch = text.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s,]+)/i);
  if (weatherMatch) {
    const place = weatherMatch[1].trim().replace(/[?.!]+$/, "");
    try {
      const res = await fetch(`${AI_BACKEND_URL}/api/web/weather?place=${encodeURIComponent(place)}`);
      const data = await res.json();
      if (!res.ok) return { text: `Couldn't get weather for "${place}": ${data.error}`, source: "open-meteo.com", query: text };
      return {
        text: `${data.place}: ${data.temperatureC}°C, humidity ${data.humidity}%, wind ${data.windKmh} km/h (as of ${new Date(data.time).toLocaleTimeString()}).`,
        source: `open-meteo.com, fetched ${new Date(data.fetchedAt).toLocaleTimeString()}`,
        query: text,
      };
    } catch {
      return { text: "Couldn't reach the weather data backend — make sure the server in /server is running.", source: "error", query: text };
    }
  }

  return null;
}

function extractSymbol(text: string): string | null {
  // "What is Tesla stock doing" -> map a few common names; otherwise look for an ALL-CAPS ticker.
  const nameMap: Record<string, string> = {
    tesla: "tsla", apple: "aapl", nvidia: "nvda", microsoft: "msft", google: "googl",
    alphabet: "googl", amazon: "amzn", meta: "meta", netflix: "nflx",
  };
  const lower = text.toLowerCase();
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (lower.includes(name)) return symbol;
  }
  const tickerMatch = text.match(/\b([A-Z]{2,5})\b/);
  if (tickerMatch) return tickerMatch[1];
  return null;
}
