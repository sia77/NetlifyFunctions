import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { getHeaders } from "../types/constants";

const getMatchScore = (query:string, symbol:string, description:string):number => {

    const q = query.toLowerCase();
    const s = symbol.toLowerCase();
    const d = description.toLowerCase();

    if ( s === q ) return 100;
    if ( s.startsWith(q) ) return 90;
    if ( s.includes(q)) return 80;
    if ( d.startsWith(q)) return 70;       // name starts with query
    if ( d.includes(q)) return 60;

    return 0;
}

const searchAssetByQuery = async (query:any):Promise<any> => {

    const summarizedResult:any = [];
    const url = process.env.FINNHUB_BASE_URL;

    try{        
        const {data} = await axios.get<any>(`${url}search`, 
            {
                headers: {
                    'X-Finnhub-Token': process.env.FINNHUB_API_KEY?.trim(),
                },
                params: {
                    exchange : 'US',
                    q : query
                }
            }
        );

        if(!data || !data.result || data.result.length === 0){
            return null;
        }

        const filteredResult = data.result.filter((item:any) => {
            return item.type && item.type.trim() !== '';
        });

        filteredResult.sort((a:any, b:any) => {
            const aScore:number = getMatchScore(query, a.symbol, a.description);
            const bScore:number = getMatchScore(query, b.symbol, b.description);
            return bScore - aScore; // descending
        });

        filteredResult.map((item:any) => {
            summarizedResult.push({symbol:item?.symbol, name:item?.description, type:item?.type});
        });

        if (summarizedResult.length === 0) {
            return null; 
        }

        return {count:data?.count, result:summarizedResult};

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching result by symbol:", err.response || err.message);
        } else {
            console.error("searchAssetByQuery - Error fetching result by symbol:", err);
        }
        throw new Error();
    }
}

const getMarketCapitalization = async (details:any[]):Promise<any[]> => {

    const url = process.env.FINNHUB_BASE_URL;
    const results:any = [];

    try{
        for (const item of details){
            const result = await axios.get<any>(`${url}stock/profile2`, 
                {
                    headers: {
                        'X-Finnhub-Token': process.env.FINNHUB_API_KEY?.trim(),
                    },
                    params: {
                        symbol : item?.symbol,
                    }
                }
            );
            results.push(
                {   ...item, 
                    marketCap:result?.data?.marketCapitalization,
                    shareOutstanding:result?.data?.shareOutstanding,
                    currency:result?.data?.currency,
                    ipo:result?.data?.ipo,
                    exchange:result?.data?.exchange,
                    weburl:result?.data?.weburl,
                    logo:result?.data?.logo});
        }

        return results;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios Error fetching mktCap:", err.response || err.message);
        } else {
            console.error("getMarketCapitalization - Error fetching mktCap:", err);
        }
        throw new Error();
    }
}

const calculateIndicators = async (searchResult:any):Promise<any> => {

    const apiKey = process.env.ALPACA_API_KEY?.trim();
    const apiSecret = process.env.ALPACA_API_SECRET?.trim();
    const url = process.env.ALPACA_BASE_URL;

    const aggregatedResult:any = [];

    const { result } = searchResult;
    const tickers:string[] = [];
    result.map((item:any)=> {
        tickers.push(item.symbol);
    });    


    try{        
        const snapResult  = await axios.get<any>(`${url}stocks/snapshots`, {
            headers:{
                'apca-api-key-id': apiKey,
                'apca-api-secret-key': apiSecret,
                'User-Agent': 'netlify-function',
            },
            params:{
                symbols: tickers.join(','),
            }
        });

        Object.entries(snapResult?.data).forEach(([ticker, details]:any) => {

            const foundItem = result.find((item: any) => item.symbol === ticker);
            const daily = details?.dailyBar;
            const prev = details?.prevDailyBar;
            const priceChange = daily?.c - prev?.c;
            const percentChange = ((priceChange / prev?.c) * 100).toFixed(2);

            //const dailyRange = daily?.h - daily?.l;
            //const gap = daily?.o - prev?.c;
            //const intradayStrength = dailyRange !== 0 ? (daily?.c - daily?.o) / dailyRange : 0;
            const tickerData = result.find((item:any) => item?.symbol === ticker);
            //const intradayIntensity = ((2 * daily?.c - dailyRange) / (dailyRange)) * daily?.v;

            aggregatedResult.push({
                id: uuidv4(),
                symbol: ticker, 
                name:tickerData['name'], 
                open:daily?.o, 
                close:daily?.c,
                prevC:prev?.c, 
                high:daily?.h, 
                low:daily?.l, 
                change: percentChange, 
                volume:daily?.v,
                //intradayStrength:intradayStrength, 
                //gap:gap,
                //dailyRange:dailyRange,
                //intradayIntensity:intradayIntensity,
                type:foundItem?.type 
            });

        });

        return aggregatedResult;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching details for a symbol:", err.response || err.message);
        } else {
            console.error("calculateIndicators - Error fetching details for a symbol:", err);
        }
        throw new Error();
    }
} 


const handler = async (event:any) => {
    const query = event.queryStringParameters?.search;

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter "search"' }),
        };
    }

    try{
        const searchResult = await searchAssetByQuery(query);

        if (!searchResult) {
            return {
                statusCode: 200,
                headers: getHeaders,
                body: JSON.stringify({result:[]}) // or `null`
            };
        }
        
        const detailResult = await calculateIndicators(searchResult);
        const aggregatedResult = await getMarketCapitalization(detailResult); 


        return {
            statusCode:200,
            headers: getHeaders,
            body: JSON.stringify({result:aggregatedResult})
        }

    }catch(err:any){

        return {
            statusCode:500,
            headers:{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({error: err?.message})
        };
    }
}

export {handler}