import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
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
import { CreateSupplementaryCardWorkflow } from './use-cases/create-supplementary-card.workflow';
import { type RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('cards')
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly clientService: ClientService,
    private readonly createSupplementaryCardWorkflow: CreateSupplementaryCardWorkflow,
  ) {}

  @Get('me')
  async listMyCards(
    @Req() req: RequestWithUser,
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
    @Req() req: RequestWithUser,
    @Param('cardNumber') cardNumber: string,
  ): Promise<CardDetail> {
    return this.cardService.getCardDetailForUser(req.user.userId, cardNumber);
  }

  @Post(':cardNumber/supplementary')
  createSupplementary(
    @Param('cardNumber') cardNumber: string,
    @Body() dto: CreateSupplementaryCardDto,
  ) {
    return this.createSupplementaryCardWorkflow.execute(cardNumber, dto);
  }

  @Patch(':cardNumber')
  editCard(
    @Req() req: RequestWithUser,
    @Param('cardNumber') cardNumber: string,
    @Body() dto: EditCardDto,
  ): Promise<CardDetail> {
    return this.cardService.editCardForUser(req.user.userId, cardNumber, dto);
  }
}
