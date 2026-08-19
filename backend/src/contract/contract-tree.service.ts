import { Injectable } from '@nestjs/common';
import { splitWay4Field } from './contract.constants';
import { Way4ContractRecord } from './contract-way4.service';

export interface ContractTreeCard {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
}

export interface ContractTreeIssuing {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  creditLimit: number;
  balance: number;
  cards: ContractTreeCard[];
}

export interface ContractTreeLiability {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  openDate: string;
  issuings: ContractTreeIssuing[];
}

@Injectable()
export class ContractTreeService {
  // Thuật toán nhào nặn mảng phẳng thành Cây
  buildContractTree(records: Way4ContractRecord[]): ContractTreeLiability[] {
    interface FlatNode {
      contractNumber: string;
      contractName: string;
      category: string;
      parentContractNumber: string | null;
      status: string;
      productCode: string;
      creditLimit: number;
      balance: number;
      openDate: string;
    }

    const flat: FlatNode[] = records.map((r) => ({
      contractNumber: String(r.ContractNumber ?? ''),
      contractName: String(r.ContractName ?? ''),
      category: splitWay4Field(r.ContractCategory).code,
      parentContractNumber: r.ParentContract
        ? splitWay4Field(r.ParentContract).label
        : null,
      status: splitWay4Field(r.Status).label,
      productCode: String(r.ProductCode ?? ''),
      creditLimit: Number(r.CreditLimit ?? 0),
      balance: Number(r.Balance ?? 0),
      openDate: String(r.OpenDate ?? ''),
    }));

    const liabilities = flat.filter(
      (n) => n.category === 'A' && !n.parentContractNumber,
    );
    const issuings = flat.filter(
      (n) => n.category === 'A' && n.parentContractNumber,
    );
    const cards = flat.filter((n) => n.category === 'C');

    return liabilities.map((liab) => ({
      contractNumber: liab.contractNumber,
      contractName: liab.contractName,
      status: liab.status,
      productCode: liab.productCode,
      openDate: liab.openDate,
      issuings: issuings
        .filter((iss) => iss.parentContractNumber === liab.contractNumber)
        .map((iss) => ({
          contractNumber: iss.contractNumber,
          contractName: iss.contractName,
          status: iss.status,
          productCode: iss.productCode,
          creditLimit: iss.creditLimit,
          balance: iss.balance,
          cards: cards
            .filter((c) => c.parentContractNumber === iss.contractNumber)
            .map((c) => ({
              contractNumber: c.contractNumber,
              contractName: c.contractName,
              status: c.status,
              productCode: c.productCode,
            })),
        })),
    }));
  }

  // Thuật toán tìm kiếm
  filterContractTree(
    tree: ContractTreeLiability[],
    search?: string,
  ): ContractTreeLiability[] {
    const q = search?.trim().toLowerCase();
    if (!q) return tree;

    const matches = (s?: string): boolean =>
      (s ?? '').toLowerCase().includes(q);

    return tree.filter((liability) => {
      if (matches(liability.contractNumber) || matches(liability.contractName))
        return true;
      return liability.issuings.some((issuing) => {
        if (matches(issuing.contractNumber) || matches(issuing.contractName))
          return true;
        return issuing.cards.some((card) => matches(card.contractNumber));
      });
    });
  }

  // Thuật toán tính toán độ ưu tiên (Recency)
  buildRecencyRank(rows: { key: string }[]): Map<string, number> {
    const rank = new Map<string, number>();
    rows.forEach((row, idx) => rank.set(row.key, idx));
    return rank;
  }

  // Thuật toán sắp xếp
  sortByRecency<T extends { contractNumber: string }>(
    items: T[],
    rank: Map<string, number>,
  ): T[] {
    return [...items].sort((a, b) => {
      const ra = rank.get(a.contractNumber) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b.contractNumber) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }
}
