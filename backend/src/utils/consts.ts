import { metalsBuilder } from './cbs/metals_cb.js';
import type { MonthCode, PolygonWsRequest } from './types.js';
import { usIndicesBuilder } from '@/utils/cbs/us_indices_cb.js';
import { SUBSCRIPTION_CONFIG } from '@/config/subscriptions.js';

// Polygon API configuration
export const POLYGON_WS_URL = 'wss://socket.polygon.io';

// Futures month codes by trading cycle
export const QUARTERLY_MONTHS: MonthCode[] = ['H', 'M', 'U', 'Z']; // Mar, Jun, Sep, Dec
export const ALL_MONTHS: MonthCode[] = [
  'F',
  'G',
  'H',
  'J',
  'K',
  'M',
  'N',
  'Q',
  'U',
  'V',
  'X',
  'Z',
];

// Pre-built subscription requests for US indices
export const futuresUSIndicesSecondsRequest: PolygonWsRequest =
  usIndicesBuilder.buildQuarterlyRequest('A', SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS);

export const futuresUSIndicesMinutesRequest: PolygonWsRequest =
  usIndicesBuilder.buildQuarterlyRequest('AM', SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS);

export const futuresMetalsSecondsRequests: PolygonWsRequest =
  metalsBuilder.buildMonthlyRequest('A', SUBSCRIPTION_CONFIG.METALS_MONTHS);

export const futuresMetalsMinutesRequests: PolygonWsRequest =
  metalsBuilder.buildMonthlyRequest('AM', SUBSCRIPTION_CONFIG.METALS_MONTHS);