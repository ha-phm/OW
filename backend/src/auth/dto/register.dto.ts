import { IsString, MinLength } from 'class-validator';
import { CreateClientDto } from '../../client/dto/create-client.dto';

// Đăng ký = mật khẩu + toàn bộ hồ sơ khách hàng (CreateClientDto đã có sẵn email)
export class RegisterDto extends CreateClientDto {
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password!: string;
}
