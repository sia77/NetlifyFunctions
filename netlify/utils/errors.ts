export class HttpError extends Error {
    statusCode: Number;
    source?:string;

    constructor(message:string, statusCode = 500, source?: string ){
        super(message);
        this.statusCode = statusCode;
        this.source = source;
        Object.setPrototypeOf(this, new.target.prototype); // Fix instanceof
    }
}