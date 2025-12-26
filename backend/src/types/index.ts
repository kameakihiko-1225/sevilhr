export enum LeadStatus {
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
  FULL_WITHOUT_TELEGRAM = 'FULL_WITHOUT_TELEGRAM',
  RETURNING = 'RETURNING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DID_NOT_CLICK_SUBMIT_BUTTON = 'DID_NOT_CLICK_SUBMIT_BUTTON',
}

export interface CreateLeadDto {
  location: string;
  companyType?: string;
  roleInCompany?: string;
  interests?: string[];
  companyDescription?: string;
  annualTurnover?: string;
  numberOfEmployees?: string;
  fullName: string;
  phoneNumber: string;
  companyName?: string;
  locale?: string;
  status: 'PARTIAL' | 'FULL' | 'FULL_WITHOUT_TELEGRAM' | 'DID_NOT_CLICK_SUBMIT_BUTTON';
}

export interface LeadResponse {
  id: string;
  status: LeadStatus;
  telegramBotUrl?: string;
}

