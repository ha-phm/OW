import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {}

// nếu muốn bỏ các field không muốn cho update --> dùng OmitType
// nếu muốn update 1 vài --> dùng PickType
