import { IsString, IsEmail, IsInt, Min, Max, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;

  @IsInt()
  @Min(3)
  @Max(12)
  age: number;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?\d{8,15}$/, { message: 'Invalid phone number' })
  phone: string;
}
