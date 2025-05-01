import axios from "axios"

const searchAssetByQuery = async (query:any):Promise<any> => {

    try{
        const url = process.env.FINNHUB_BASE_URL;
        const result = await axios.get<any>(`${url}search`, 
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

        return result.data;

    }catch(err:any){
        if (axios.isAxiosError(err)) {
            console.error("Axios error fetching asset symbols:", err.response || err.message);
        } else {
            console.error("Error fetching asset symbols:", err);
        }
        throw new Error();
    }
}


const handler = async (event:any) => {
    const query = event.queryStringParameters?.search;

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter "q"' }),
        };
    }

    try{
        const result = await searchAssetByQuery(query);

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
            statusCode:500,
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