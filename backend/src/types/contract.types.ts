export interface ActiveContract {
  ticker: string;
  productCode: string;
  lastTradeDate: string;
  active: boolean;
}

export interface StoredActiveContracts {
  productCode: string;
  updatedAt: number;
  contracts: ActiveContract[];
}
