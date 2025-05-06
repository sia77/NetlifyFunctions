import axios from "axios";
import { HistoricalBarSpec } from '../types/interfaces';


const getHistoricalBarData = async (data:HistoricalBarSpec):Promise<any> => {

    const apiKey = process.env.ALPACA_API_KEY?.trim();
    const apiSecret = process.env.ALPACA_API_SECRET?.trim();
    const url = process.env.ALPACA_BASE_URL;

    try{
        const result = await axios.get<any>(`${url}stocks/${data.ticker}/bars`,
            {
                headers:{
                    'apca-api-key-id': apiKey,
                    'apca-api-secret-key': apiSecret,
                    'User-Agent': 'netlify-function',
                },
                params:{
                    timeframe: data.timeFrame,
                    start: data.start,
                    end: data.end,
                    limit: data.limit,  //1000
                    adjustment:'split',
                    feed:'sip',
                    sort:'asc'
                }
            }
        )

        return result.data;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching Historical bar data:", err.response || err.message);

            throw{
                statusCode: err.response?.status || 500,
                message: err?.response?.data?.message || err.message || "Axios request failed",
                source: "Finnhub"
            };

        } else {
            console.error("getHistoricalBarData - Error fetching Historical bar data:", err);
            throw{
                statusCode: 500,
                message: err?.message || "Unknown error occurred",
            };
        }
    }
}

const handler = async (event:any) => {

    const { ticker, start, end, timeFrame, limit } = event.queryStringParameters;    

    if (!ticker || !start || !end || !timeFrame || !limit) {
        return {
            statusCode: 400,
            headers:{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: 'Missing one or more query parameters...' }),
        };
    }

    try{
        const result = await getHistoricalBarData({ ticker, start, end, timeFrame, limit });

        return {
            statusCode:200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(result)
        }
    }catch(err:any){

        return {
            statusCode:err.statusCode || 500,
            headers:{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: err.message || "Unexpected error occurred" })
        };
    }
}

export {handler}