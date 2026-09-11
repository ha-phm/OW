import { Prisma } from '@prisma/client';

export function buildUserRelationWhere(query: {
  userEmail?: string;
  userIsActive?: string;
}): Prisma.UserWhereInput | undefined {
  const userConditions: Prisma.UserWhereInput = {};
  let hasUserConditions = false;

  if (query.userEmail) {
    userConditions.email = {
      contains: query.userEmail.trim(),
      mode: 'insensitive',
    };
    hasUserConditions = true;
  }

  if (query.userIsActive !== undefined) {
    userConditions.isActive = query.userIsActive === 'true';
    hasUserConditions = true;
  }

  return hasUserConditions ? userConditions : undefined;
}
