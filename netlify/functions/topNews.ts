
import { Handler } from '@netlify/functions';
import axios from 'axios';

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
            console.error("Axios error fetching asset symbols:", err.response || err.message);
        } else {
            console.error("Error fetching asset symbols:", err);
        }
        throw new Error();

    }

};

const handler = async () =>{

    try{
        const result = await getTopNews();

        return {
            statusCode: 200,
            headers:{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(result)
        }
    }
    catch(err:any){

        return {
            statusCode: 500,
            headers:{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', 
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(err?.message)
        };

    }


}

export {handler}