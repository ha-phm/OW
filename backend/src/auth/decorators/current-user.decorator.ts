import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: any }>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request.user; // là object mà validate() ở jwt.strategy return ra
  },
);
