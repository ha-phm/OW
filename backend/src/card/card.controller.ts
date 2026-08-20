import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  Post,
} from '@nestjs/common';
import {
  CardService,
  CardListItem,
  CardDetail,
  PaginatedResult,
} from './card.service';
import { EditCardDto } from './dto/edit-card.dto';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';
import { ClientService } from '../client/client.service';
import { CreateSupplementaryCardDto } from './dto/create-supplymentary-card.dto';

interface RequestWithUser {
  user: {
    userId: number;
    clientId?: string | null;
  };
}

@Controller('cards')
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly clientService: ClientService,
  ) {}

  // Route tĩnh 'me' PHẢI đứng trước route động ':cardNumber' bên dưới.
  @Get('me')
  async listMyCards(
    @Request() req: RequestWithUser,
    @Query() query: GetCardsQueryDto,
  ): Promise<PaginatedResult<CardListItem>> {
    if (!req.user.clientId) {
      return {
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        },
      };
    }
    const clientResult = await this.clientService.getByParams(
      req.user.clientId,
    );
    const clientNumber =
      clientResult?.IssClientDetailsV2APIRecord?.ClientNumber;
    if (!clientNumber) {
      return {
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        },
      };
    }
    return this.cardService.listCardsForUser(
      req.user.userId,
      String(clientNumber),
      query,
    );
  }

  @Get(':cardNumber')
  getCardDetail(
    @Request() req: RequestWithUser,
    @Param('cardNumber') cardNumber: string,
  ): Promise<CardDetail> {
    return this.cardService.getCardDetailForUser(req.user.userId, cardNumber);
  }

  @Post(':cardNumber/supplementary')
  async createSupplementary(
    @Param('cardNumber') cardNumber: string,
    @Body() dto: CreateSupplementaryCardDto,
  ) {
    return this.cardService.createSupplementaryCard(cardNumber, dto);
  }

  @Patch(':cardNumber')
  editCard(
    @Request() req: RequestWithUser,
    @Param('cardNumber') cardNumber: string,
    @Body() dto: EditCardDto,
  ): Promise<CardDetail> {
    return this.cardService.editCardForUser(req.user.userId, cardNumber, dto);
  }
}
