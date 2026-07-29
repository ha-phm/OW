
import { z } from 'zod';

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng phải là YYYY-MM-DD'),
  gender: z.enum(['M', 'F'], { message: 'Vui lòng chọn giới tính' }),
  maritalStatusCode: z.enum(['S', 'M', 'D', 'W'], { message: 'Vui lòng chọn tình trạng hôn nhân' }),
  salutationCode: z.enum(['MR', 'MRS', 'MS'], { message: 'Vui lòng chọn danh xưng' }),
  mobilePhone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  email: z.string().email('Email không hợp lệ'),
  identityCardNumber: z.string().min(1, 'Vui lòng nhập CCCD/CMND'),
  identityCardDetails: z.string().optional(),
  socialSecurityNumber: z.string().min(1, 'Vui lòng nhập số BHXH/CMND'),
  individualTaxpayerNumber: z.string().optional(),
  addressLine1: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  city: z.string().min(1, 'Vui lòng nhập thành phố'),
  homePhone: z.string().optional(),
  companyName: z.string().optional(),
  profession: z.string().optional(),
  branch: z.string().optional(),
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;