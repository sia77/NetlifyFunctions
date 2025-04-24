import { Handler } from '@netlify/functions';
import axios from 'axios';

const getListOfAssetSymbols = async (): Promise<string[]> => {
  try {
    const res = await axios.get('https://finnhub.io/api/v1/stock/symbol', {
      headers: {
        'X-Finnhub-Token': process.env.FINNHUB_API_KEY,
      },
      params: {
        exchange: 'US',
      },
    });

    // Ensure response contains valid data
    return res.data
      .filter((item: any) => item.symbol)
      .map((item: any) => item.symbol);
  } catch (err) {
    console.error("Error fetching asset symbols:", err);
    throw new Error("Failed to fetch asset symbols");
  }
};

const getAssetsSnapshot = async (tickers: string[]): Promise<any> => {
  const apiKey = process.env.ALPACA_API_KEY?.trim();
  const apiSecret = process.env.ALPACA_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("API keys are missing from environment variables.");
  }

  try {
    const res = await axios.get('https://data.alpaca.markets/v2/stocks/snapshots', {
      headers: {
        'apca-api-key-id': apiKey,
        'apca-api-secret-key': apiSecret,
        'User-Agent': 'netlify-function',
      },
      params: {
        symbols: tickers.join(','),
      },
    });

    const snapshot = res.data;
    const gainers = [], losers = [], mostActive = [];

    for (const ticker in snapshot) {
      const data = snapshot[ticker];
      const prevClose = data.prevDailyBar?.c;
      const todayClose = data.dailyBar?.c;

      if (prevClose && todayClose) {
        const delta = ((todayClose - prevClose) / prevClose) * 100;
        const entry = { ticker, delta: +delta.toFixed(2) };
        delta > 0 ? gainers.push(entry) : losers.push(entry);
        mostActive.push(entry);
      }
    }

    return {
      gainers: gainers.sort((a, b) => b.delta - a.delta),
      losers: losers.sort((a, b) => a.delta - b.delta),
      mostActive: mostActive.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    };
  } catch (err) {
    console.error("Error fetching asset snapshots:", err);
    throw new Error("Failed to fetch asset snapshots");
  }
};

const handler: Handler = async (event, context) => {
  try {
    const tickerList1 = ['AAPL', 'NVDA', 'F', 'TSLA', 'GOOG', 'MSFT', 'META'];
    const tickerList2 = await getListOfAssetSymbols();
    const combinedTickers = [...tickerList1, ...tickerList2.slice(0, 100)];

    const result = await getAssetsSnapshot(combinedTickers);

    const allowedOrigins = ['http://localhost:4200', 'https://stocktracker-angular.netlify.app'];
    const origin = event.headers.origin ?? '' ;
    const isAllowedOrigin = allowedOrigins.includes(origin || '');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET', 
        'Access-Control-Allow-Headers': 'Content-Type', 
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

export { handler };