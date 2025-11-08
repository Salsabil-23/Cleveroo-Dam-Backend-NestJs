import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegisterDto } from './dto/register.dto';

@Controller('register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    return this.registrationService.registerChildAndParent(dto);
  }
}
