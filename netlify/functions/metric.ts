import axios from "axios";

const getAssetMetric = async (ticker:string):Promise<any> => {

    const url = process.env.FINNHUB_BASE_URL;

    try{

        const result = await axios.get<any>(`${url}stock/metric`, {
            headers:{
                'X-Finnhub-Token': process.env.FINNHUB_API_KEY?.trim(),
            }, 
            params:{
                symbol:ticker,
                metric: 'all'
            }
        });

        return result.data;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching metrics by symbol:", err.response || err.message);
            throw {
                statusCode: err.response?.status || 500,
                message: err?.response?.data?.message || err.message || "Axios request failed",
                source: "Finnhub"
            }
        } else {
            console.error("getAssetMetric - Error fetching metrics by symbol:", err);
            throw{
                statusCode: 500,
                message: err?.message || "Unknown error occurred",
            };
        }

    }
}



const handler = async (event:any) => {

    const query = event.queryStringParameters?.ticker;

    if(!query){
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter "ticker"' }),
        }
    }

    try{
        const result = await getAssetMetric(query);
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