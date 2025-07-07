import axios from "axios"
import { getHeaders } from "../types/constants";


const getCompanyNews = async (symbol:string,from:string, to:string):Promise<any>=> {

    try{

        const res = axios.get(`${process.env.FINNHUB_BASE_URL}company-news`,{
            headers: {
                'X-Finnhub-Token': process.env.FINNHUB_API_KEY?.trim(),
            },
            params: {
                symbol:symbol,
                from:from,
                to:to
            },
        });
        return res;

    }catch( err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching companyNews by symbol:", err.response || err.message);
            throw {
                statusCode: err.response?.status || 500,
                message: err?.response?.data?.message || err.message || "Axios request failed",
                source: "Finnhub"
            }
        } else {
            console.error("getCompanyNews - Error fetching companyNews by symbol:", err);
            throw{
                statusCode: 500,
                message: err?.message || "Unknown error occurred",
            };
        }
    }
}

const handler = async (event:any) => {

    const params = event.queryStringParameters;

    const symbol = params?.symbol || '';
    const from = params?.from || '2025-07-07';
    const to = params?.to || '2025-07-07';

    try{

        const response = await getCompanyNews(symbol, from, to);
        return {
            statusCode: 200,
            headers:getHeaders,
            body: JSON.stringify(response)
        }

    }catch(err:any){
        return {
            statusCode:err.statusCode || 500,
            headers:getHeaders,
            body: JSON.stringify({ message: err.message || "Unexpected error occurred" })
        };
    }
}

export {handler}