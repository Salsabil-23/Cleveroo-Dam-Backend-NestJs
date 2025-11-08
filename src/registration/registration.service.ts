import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Child } from '../child/child.schema';
import { Parent } from '../parent/parent.schema';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectConnection() private readonly connection: Connection,
    private emailService: EmailService,
  ) {}

  async registerChildAndParent(dto: RegisterDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Génération d'avatars automatiques (ex: DiceBear)
      const childAvatar = this.generateAvatar(dto.username);
      const parentAvatar = this.generateAvatar(dto.email);

      // Création de l'enfant
      const child = await this.childModel.create(
        [
          {
            username: dto.username,
            password: hashedPassword,
            age: dto.age,
            avatar: childAvatar,
          },
        ],
        { session },
      );

      // Création du parent lié à cet enfant
      const parent = await this.parentModel.create(
        [
          {
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            avatar: parentAvatar,
            child: child[0]._id,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      await this.emailService.sendRegistrationEmail(dto.email, dto.username);

      return {
        message: 'Registration successful',
        parent: parent[0],
        child: child[0],
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private generateAvatar(seed: string): string {
    return `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
  }
}
