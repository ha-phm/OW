import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { buildCreateCardXml, buildActivateCardXml } from './card.templates';

export interface CardContractResponse {
  success: boolean;
  cardId: string;
  cardNumber: string;
  expiryDate: string;
  sequenceNumber: string;
}

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createCardContract(dto: CreateCardDto): Promise<CardContractResponse> {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildCreateCardXml(dto, officer);

    // sendRaw đã tự unwrap kết quả (trả về OutObject hoặc result),
    // nên không cần lấy thêm rawResult.CreateCardV3Result nữa
    const data = await this.soap.sendRaw<any>('CreateCardV3', xml);

    if (!data || !data.CardNumber) {
      this.logger.error('Lỗi parse kết quả Way4 cho CreateCardV3', data);
      throw new InternalServerErrorException(
        'Không lấy được định danh thẻ từ WAY4',
      );
    }

    return {
      success: true,
      cardId: data.CreatedCard ?? '',
      cardNumber: data.CardNumber ?? '',
      expiryDate: data.ExpiryDate ?? '',
      sequenceNumber: data.SequenceNumber ?? '',
    };
  }

  async activateCard(
    contractNumber: string,
    reason: string = 'CUSTOMER REQUEST',
  ) {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? 'WX_ADMIN';
    const xml = buildActivateCardXml(contractNumber, reason, officer);

    this.logger.log(`Đang gửi yêu cầu kích hoạt thẻ PAN: ${contractNumber}`);

    // sendRaw đã throw BadRequestException nếu RetCode !== 0,
    // nên nếu chạy tới đây là coi như thành công. Check lại RetCode
    // chỉ để phòng hờ (defensive), so sánh cả number lẫn string.
    const data = await this.soap.sendRaw<any>('ActivateCard', xml);

    if (data?.RetCode !== 0 && data?.RetCode !== '0') {
      this.logger.error(`Kích hoạt thẻ thất bại`, data);
      throw new InternalServerErrorException(
        `Lỗi kích hoạt thẻ từ WAY4: ${data?.RetMsg || 'Unknown error'}`,
      );
    }

    // Đổi từ prisma.cardContract -> prisma.card theo schema mới
    // (bảng CardContract cũ đã tách thành Contract + Card)
    await this.prisma.card.updateMany({
      where: { cardNumber: contractNumber },
      data: { status: 'ACTIVATED' },
    });

    return {
      success: true,
      message: data?.RetMsg || 'Card activated successfully',
    };
  }
}
