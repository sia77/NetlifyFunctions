import { APIGatewayEvent } from 'aws-lambda';
import { AuthResult } from '../types/interfaces';

export type AuthenticatedHandler = (
  authData: AuthResult,
  event: APIGatewayEvent
) => Promise<any>;