import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ParentModule } from './parent/parent.module';
import { ChildModule } from './child/child.module';
import { RegistrationModule } from './registration/registration.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // 1️⃣ Charger .env globalement avant tout
    ConfigModule.forRoot({ isGlobal: true }),

    // 2️⃣ Connexion MongoDB via Atlas (avec validation du type)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || '', // jamais undefined
      }),
      inject: [ConfigService],
    }),

    // 3️⃣ Autres modules
    AuthModule,
    ParentModule,
    ChildModule,
    RegistrationModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
