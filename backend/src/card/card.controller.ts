import { Controller, Post, Body, Param } from '@nestjs/common';
import { CardService, CardContractResponse } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  createCard(@Body() dto: CreateCardDto): Promise<CardContractResponse> {
    return this.cardService.createCardContract(dto);
  }

  @Post(':contractNumber/activate')
  activateCard(
    @Param('contractNumber') contractNumber: string,
    @Body('reason') reason?: string,
  ) {
    return this.cardService.activateCard(contractNumber, reason);
  }
}
