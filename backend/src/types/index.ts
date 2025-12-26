export enum LeadStatus {
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
  RETURNING = 'RETURNING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
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
  status: 'PARTIAL' | 'FULL';
}

export interface LeadResponse {
  id: string;
  status: LeadStatus;
  telegramBotUrl?: string;
}

