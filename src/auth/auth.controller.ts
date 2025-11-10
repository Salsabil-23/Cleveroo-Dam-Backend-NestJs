import { Body, Controller, Post, BadRequestException, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from '../registration/dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/parent')
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'parent@example.com' },
        password: { type: 'string', example: 'Azerty123' },
      },
    },
  })
  async loginParent(@Body() body: { email: string; password: string }) {
    return this.authService.loginParent(body.email, body.password);
  }

  @Post('login/child')
  @ApiBody({
    schema: {
      properties: {
        username: { type: 'string', example: 'petitLeo' },
        password: { type: 'string', example: 'Azerty123' },
      },
    },
  })
  async loginChild(@Body() body: { username: string; password: string }) {
    return this.authService.loginChild(body.username, body.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      console.error('Error while registering: ', error);
      throw new BadRequestException(error.message);
    }
  }

  // ✅ Récupération profil parent
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile/parent')
  async getProfileParent(@Request() req: any) {
    return this.authService.getParentProfile(req.user.id); // 🔥 note: id et non userId
  }

  // ✅ Récupération profil enfant
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile/child')
  async getProfileChild(@Request() req: any) {
    console.log('User connected :', req.user);
    return this.authService.getChildProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Patch('profile/child')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      username: { type: 'string', example: 'LittleLeoUpdated' },
      age: { type: 'number', example: 10 },
    },
  },
})
async updateChildProfile(
  @Request() req,
  @Body() body: { username?: string; age?: number },
) {
  const userId = req.user.id;
  return this.authService.updateChildProfile(userId, body.username, body.age);
}


  // ✅ Modifier le mot de passe parent
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Patch('profile/parent/password')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      oldPassword: { type: 'string', example: 'OldPass123' },
      newPassword: { type: 'string', example: 'NewPass123' },
      confirmPassword: { type: 'string', example: 'NewPass123' },
    },
  },
})
@ApiResponse({ status: 200, description: 'Password updated successfully.' })
@ApiResponse({ status: 400, description: 'Incorrect old password or validation error.' })
async updateParentPassword(
  @Request() req,
  @Body() body: { oldPassword: string; newPassword: string; confirmPassword: string },
) {
  const userId = req.user.id;
  return this.authService.updateParentPassword(
    userId,
    body.oldPassword,
    body.newPassword,
    body.confirmPassword,
  );
}
 @Post('forgot-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'parent@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reset code sent to email successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Email not found' 
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // 🔹 Étape 2 : Vérifier le code
  @Post('verify-reset-code')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'parent@example.com' },
        code: { type: 'string', example: '123456' },
      },
      required: ['email', 'code'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code verified successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired code' 
  })
  async verifyResetCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  // 🔹 Étape 3 : Réinitialiser le mot de passe
  @Post('reset-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'parent@example.com' },
        code: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'NewPass123' },
        confirmPassword: { type: 'string', example: 'NewPass123' },
      },
      required: ['email', 'code', 'newPassword', 'confirmPassword'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid code or passwords do not match' 
  })
  async resetPassword(
    @Body() body: { 
      email: string; 
      code: string; 
      newPassword: string; 
      confirmPassword: string;
    }
  ) {
    return this.authService.resetPassword(
      body.email, 
      body.code, 
      body.newPassword, 
      body.confirmPassword
    );
  }

  @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Patch('profile/parent')
async updateParentProfile(
  @Request() req,
  @Body() body: { email?: string; phone?: string },
) {
  const userId = req.user.id;
  return this.authService.updateParentProfile(userId, body.email, body.phone);
}
}
