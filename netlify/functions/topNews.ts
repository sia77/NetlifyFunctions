
import axios from 'axios';
import { getHeaders } from '../constants/headers';
import { HttpError } from '../utils/errors'

const getTopNews = async ():Promise<any[]> => {

    try{
        const res = await axios.get(`${process.env.FINNHUB_BASE_URL}news`, {
            headers: {
                'X-Finnhub-Token': process.env.FINNHUB_API_KEY?.trim(),
            },
            params: {
                category : 'general',
            },
        });
        return res.data;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching topnews:", err.response || err.message);
            throw new HttpError(
                err?.response?.data?.message || err.message || "Axios topnews request failed",
                err.response?.status || 500,
                "Finnhub"
            );
        } else {
            console.error("Error fetching topnews:", err);
            throw new HttpError(
                err?.response?.data?.message || err.message || "topnews request failed",
                err.response?.status || 500,
                "Finnhub"
            );
        }       
    }
};

const handler = async () =>{

    try{
        const result = await getTopNews();

        return {
            statusCode: 200,
            headers:getHeaders,
            body: JSON.stringify(result)
        }
    }
    catch(err:any){

        return {
            statusCode:err.statusCode || 500,
            headers:getHeaders,
            body: JSON.stringify({ message: err.message || "Unexpected error occurred" })
        };
    }
}

export {handler}