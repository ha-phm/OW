import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  
  email: z.string().email('Email không hợp lệ').max(100, 'Email quá dài'),
  
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không quá 50 ký tự'),

  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng phải là YYYY-MM-DD'),
  gender: z.enum(['M', 'F'], { message: 'Vui lòng chọn giới tính' }),
  maritalStatusCode: z.enum(['S', 'M', 'D', 'W'], { message: 'Vui lòng chọn tình trạng hôn nhân' }),
  salutationCode: z.enum(['MR', 'MRS', 'MS'], { message: 'Vui lòng chọn danh xưng' }),
  mobilePhone: z.string()
    .regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'),
  identityCardNumber: z.string()
    .length(12, 'CCCD/CMND phải có đúng 12 chữ số')
    .regex(/^\d+$/, 'CCCD chỉ được chứa chữ số'),
  identityCardDetails: z.string().optional(),
  socialSecurityNumber: z.string().min(1, 'Vui lòng nhập số BHXH/CMND'),
  individualTaxpayerNumber: z.string().optional(),
  addressLine1: z.string()
    .min(1, 'Vui lòng nhập địa chỉ')
    .max(255, 'Địa chỉ quá dài (tối đa 255 ký tự)'),
    
  city: z.string().min(1, 'Vui lòng nhập thành phố').max(100, 'Tên thành phố quá dài'),
  homePhone: z.string().optional(),
  companyName: z.string().optional(),
  profession: z.string().optional(),
  branch: z.string().optional(),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const profileEditSchema = signupSchema
  .omit({
    password: true,       
    salutationCode: true, 
    branch: true,         
  })
  .extend({
    citizenship: z.string().min(1, 'Vui lòng nhập quốc tịch'), // Thêm trường mới
  });
  
export type EditFormData = z.infer<typeof profileEditSchema>;