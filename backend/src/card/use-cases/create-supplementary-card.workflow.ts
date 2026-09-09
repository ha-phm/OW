import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CardWay4Service } from '../card-way4.service';
import { CreateSupplementaryCardDto } from '../dto/create-supplymentary-card.dto';
import {
  asRecord,
  toComparableString,
} from '../../common/utils/way4-response.util';

@Injectable()
export class CreateSupplementaryCardWorkflow {
  private readonly logger = new Logger(CreateSupplementaryCardWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly way4Service: CardWay4Service,
  ) {}

  async execute(mainCardNumber: string, dto: CreateSupplementaryCardDto) {
    // 1. Kiểm tra thẻ chính trong DB
    const mainCard = await this.prisma.card.findUnique({
      where: { cardNumber: mainCardNumber },
      include: { issuingContract: true },
    });

    if (!mainCard) {
      throw new NotFoundException(
        'Không tìm thấy thông tin thẻ chính trong hệ thống',
      );
    }

    const clientNumber = mainCard.issuingContract?.clientNumber;
    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được mã khách hàng từ hợp đồng.',
      );
    }

    const issuingContractNumber = mainCard.issuingContract.contractNumber;
    const safeProductCode = mainCard.productCode ?? '';
    const safeCardName = dto.cardName || 'Supplementary Card';

    // 2. Gọi WAY4
    const rawResult: unknown =
      await this.way4Service.callCreateSupplementaryCard(
        clientNumber,
        issuingContractNumber,
        safeProductCode,
        safeCardName,
        dto.embossedFirstName,
        dto.embossedLastName,
      );

    // 3. Bóc tách dữ liệu WAY4
    const envelope = asRecord(rawResult) ?? {};
    const data = asRecord(envelope.CreateSupplementaryCardV2Result) ?? envelope;

    const retCode = toComparableString(data.RetCode);
    if (retCode !== '0') {
      this.logger.error('Lỗi tạo thẻ phụ:', data);
      throw new InternalServerErrorException(
        typeof data.RetMsg === 'string'
          ? data.RetMsg
          : 'WAY4 từ chối phát hành thẻ phụ.',
      );
    }

    const newCardPan = toComparableString(data.CardNumber);
    if (!newCardPan) {
      throw new InternalServerErrorException(
        'WAY4 không trả về số thẻ sau khi tạo.',
      );
    }

    const rawExpiry = toComparableString(data.ExpiryDate);
    const rawSeq = toComparableString(data.SequenceNumber);

    // 4. Lưu Database với số thật
    const newCard = await this.prisma.card.create({
      data: {
        cardNumber: String(newCardPan),
        cardName: safeCardName,
        expiryDate: rawExpiry ? String(rawExpiry) : null,
        sequenceNumber: rawSeq ? String(rawSeq) : null,
        productCode: safeProductCode,
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
        issuingContractId: mainCard.issuingContractId,
      },
    });

    return newCard;
  }
}
