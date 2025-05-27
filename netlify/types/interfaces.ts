
export interface HistoricalBarSpec{
    ticker:string;
    start:string;
    end:string;
    timeFrame:string;
    limit:number;
}

export interface AuthResult {
    auth0_sub: string;
    email: string;
    decoded: any; 
    userInfo: any; 
  }

  export interface InitialUserInfo {
    auth0_sub: string | (() => string) | undefined;
    email: string;
  }

  export interface User {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    address: string | null;
    state_province: string | null;
    postal_code: string | null;
    auth0_sub: string;
    created_at: string;
    city:string;
    unit:string;
    country:string;
  }
