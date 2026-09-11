// src/card/mappers/card.mapper.ts
import { Card } from '@prisma/client';
import { CardDetail, Way4CardDetailRecord } from '../interfaces/card.interface';
import { maskCardNumber } from '../../common/utils/text.utils';
import { splitWay4Field } from '../../common/way4.util';
import {
  asRecord,
  toNumberOrUndefined,
} from '../../common/utils/way4-response.util';

export function formatExpiry(raw?: string | number | null): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const str = String(raw);
  if (/^\d{4}$/.test(str)) return `${str.slice(2, 4)}/${str.slice(0, 2)}`;
  return str;
}

export function mapWay4CardDetail(raw: unknown, fallback: Card): CardDetail {
  const envelope = asRecord(raw) ?? {};
  const record = (asRecord(envelope.IssContractDetailsAPIOutputV2Record) ??
    envelope) as Way4CardDetailRecord;

  return {
    cardNumber: fallback.cardNumber,
    maskedCardNumber: maskCardNumber(fallback.cardNumber),
    cardName: fallback.cardName || record.ContractName || 'Card Contract',
    embossedFirstName:
      fallback.embossedFirstName || record.EmbossedFirstName || '',
    embossedLastName:
      fallback.embossedLastName || record.EmbossedLastName || '',
    embossedCompanyName: record.EmbossedCompanyName,
    status: record.Status
      ? splitWay4Field(record.Status).label
      : fallback.status,
    expiryDate: formatExpiry(record.ExpirationDate ?? fallback.expiryDate),
    productName: record.Product
      ? splitWay4Field(record.Product).label
      : undefined,
    creditLimit: toNumberOrUndefined(record.CreditLimit),
    available: toNumberOrUndefined(record.Available),
    currency: record.Currency
      ? splitWay4Field(record.Currency).label
      : undefined,
    openDate: record.OpenDate,
    branch: record.Branch ? splitWay4Field(record.Branch).label : undefined,
    institution: record.Institution
      ? splitWay4Field(record.Institution).label
      : undefined,
    clientFullName: record.ClientFullName,
    totalDue: toNumberOrUndefined(record.TotalDue),
    pastDue: toNumberOrUndefined(record.PastDue),
    issuingContractNumber: '',
  };
}
