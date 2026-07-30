import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

export interface IssClientDetailsV2APIRecord {
  Institution?: string;
  Branch?: string;
  ClientCategory?: string;
  ClientType?: string;
  Name?: string;
  FullName?: string;
  ShortName?: string;
  Salutation?: string;
  Gender?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  BirthDate?: string;
  Citizenship?: string;
  MaritalStatus?: string;
  IndividualTaxpayerNumber?: string;
  HomePhone?: string;
  MobilePhone?: string | number;
  EMail?: string;
  Address?: string;
  City?: string;
  AddressLine1?: string;
  CompanyName?: string;
  Profession?: string;
  IdentityCard?: string;
  IdentityCardNumber?: string;
  IdentityCardDetails?: string;
  LastApplicationStatus?: string;
  RegistrationDate?: string;
  SocialSecurityNumber?: string;
  ID?: string;
  ClientNumber?: string;
}

interface ClientProfile {
  IssClientDetailsV2APIRecord: IssClientDetailsV2APIRecord | null;
  clientId: string | null;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiGet<ClientProfile>('/clients/me'),
    retry: false,
  });
}