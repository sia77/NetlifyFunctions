
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

  export interface UserInfo {
    auth0_sub: string | (() => string) | undefined;
    email: string;
  }