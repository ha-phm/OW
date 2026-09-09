// src/contract/use-cases/quick-open-card.workflow.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientService } from '../../client/client.service';
import { CardService } from '../../card/card.service';
import {
  ContractWay4Service,
  ContractResponse,
} from '../contract-way4.service';
import { ContractService, CardApplicationResponse } from '../contract.service';
import { QuickOpenCardDto } from '../dto/quick-open-card.dto';
import {
  CARD_CATEGORY_PRODUCT_CODE,
  CARD_CATEGORY_LABEL,
} from '../contract.constants';
import { toStringOrNull } from '../../common/utils/way4-response.util';
import { CardContractResponse } from '../../card/card-way4.service';

@Injectable()
export class QuickOpenCardWorkflow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
    private readonly cardService: CardService,
    private readonly way4Service: ContractWay4Service,
    private readonly contractService: ContractService, // Dùng để xoá cache
  ) {}

  private async createLiabilityForUser(
    userId: number,
    clientNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<ContractResponse> {
    const result = await this.way4Service.callCreateContract({
      clientNumber,
      productCode: 'LIAB_TRAINING01',
      contractName: 'Liability Contract',
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      reason: 'Mo ho so han muc',
    });
    await this.prisma.contract.create({
      data: {
        userId,
        clientNumber,
        contractNumber: result.contractNumber!,
        applicationNumber: toStringOrNull(result.applicationNumber),
        type: 'LIABILITY',
        productCode: 'LIAB_TRAINING01',
        contractName: 'Liability Contract',
      },
    });
    this.contractService.invalidateTreeCache(clientNumber);
    return result;
  }

  private async addIssuingUnderLiability(
    userId: number,
    liabilityContractNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<ContractResponse> {
    const liability = await this.prisma.contract.findFirst({
      where: {
        userId,
        type: 'LIABILITY',
        contractNumber: liabilityContractNumber,
      },
    });
    if (!liability)
      throw new NotFoundException('Không tìm thấy hợp đồng hạn mức này.');

    const existingIssuing = await this.prisma.contract.findFirst({
      where: { parentContractId: liability.id, type: 'ISSUING' },
    });
    if (existingIssuing)
      throw new BadRequestException('Đã có hợp đồng phát hành.');

    const result = await this.way4Service.callCreateIssuingContract({
      liabContractNumber: liability.contractNumber,
      clientNumber: liability.clientNumber,
      productCode: 'ISSUING_TRAINING01',
      contractName: 'Issuing Contract',
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      paymentOption: dto.paymentOption,
      bank: dto.bank,
      account: dto.account,
      bankCode: dto.bankCode,
      accName: dto.accName,
    });
    await this.prisma.contract.create({
      data: {
        userId,
        clientNumber: liability.clientNumber,
        contractNumber: result.contractNumber!,
        applicationNumber: toStringOrNull(result.applicationNumber),
        type: 'ISSUING',
        productCode: 'ISSUING_TRAINING01',
        contractName: 'Issuing Contract',
        parentContractId: liability.id,
      },
    });
    this.contractService.invalidateTreeCache(liability.clientNumber);
    return result;
  }

  private async addCardUnderIssuing(
    userId: number,
    issuingContractNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<CardApplicationResponse> {
    const issuing = await this.prisma.contract.findFirst({
      where: { userId, type: 'ISSUING', contractNumber: issuingContractNumber },
      select: {
        id: true,
        contractNumber: true,
        clientNumber: true,
        parentContract: {
          select: {
            contractNumber: true, // Chỉ lấy mã hợp đồng cha để trả về Message
          },
        },
      },
    });

    if (!issuing)
      throw new NotFoundException('Không tìm thấy hợp đồng phát hành này.');

    const productCode = CARD_CATEGORY_PRODUCT_CODE[dto.cardCategory];

    const cardResult: CardContractResponse =
      await this.cardService.createCardContract({
        issuingContractNumber: issuing.contractNumber,
        productCode,
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
        embossedCompanyName: dto.embossedCompanyName,
      });

    await this.prisma.card.create({
      data: {
        issuingContractId: issuing.id,
        cardNumber: String(cardResult.cardNumber),
        expiryDate: toStringOrNull(cardResult.expiryDate),
        sequenceNumber: toStringOrNull(cardResult.sequenceNumber),
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
        productCode,
        cardName: dto.cardName,
      },
    });

    this.contractService.invalidateTreeCache(issuing.clientNumber);

    return {
      success: true,
      message: `Mở thẻ "${CARD_CATEGORY_LABEL[dto.cardCategory]}" thành công`,
      liabContract: issuing.parentContract?.contractNumber,
      issuingContract: issuing.contractNumber,
      cardPan: cardResult.cardNumber,
      expiryDate: cardResult.expiryDate,
    };
  }

  public async quickOpenCard(
    userId: number,
    clientId: string,
    dto: QuickOpenCardDto,
  ): Promise<CardApplicationResponse> {
    const clientResult = await this.clientService.getByParams(clientId);
    const profile = clientResult.IssClientDetailsV2APIRecord;
    if (!profile?.ClientNumber)
      throw new InternalServerErrorException(
        'Không lấy được hồ sơ khách hàng.',
      );

    const clientNumber = String(profile.ClientNumber);
    let liability = await this.prisma.contract.findFirst({
      where: { userId, type: 'LIABILITY' },
    });
    if (!liability) {
      await this.createLiabilityForUser(userId, clientNumber, dto);
      liability = await this.prisma.contract.findFirst({
        where: { userId, type: 'LIABILITY' },
      });
    }

    let issuing = await this.prisma.contract.findFirst({
      where: { parentContractId: liability!.id, type: 'ISSUING' },
    });
    if (!issuing) {
      await this.addIssuingUnderLiability(
        userId,
        liability!.contractNumber,
        dto,
      );
      issuing = await this.prisma.contract.findFirst({
        where: { parentContractId: liability!.id, type: 'ISSUING' },
      });
    }
    return this.addCardUnderIssuing(userId, issuing!.contractNumber, dto);
  }
}
