import { Injectable, UnauthorizedException, NotFoundException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Parent } from '../parent/parent.schema';
import { Child } from '../child/child.schema';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../registration/dto/register.dto';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent & { _id: Types.ObjectId }>,
    @InjectModel(Child.name) private childModel: Model<Child & { _id: Types.ObjectId }>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateParent(email: string, password: string) {
    const parent = await this.parentModel.findOne({ email });
    if (!parent) throw new UnauthorizedException('Email not found');

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) throw new UnauthorizedException('Incorrect password');

    return parent;
  }

  async validateChild(username: string, password: string) {
    const child = await this.childModel.findOne({ username });
    if (!child) throw new UnauthorizedException('Username not found');

    const valid = await bcrypt.compare(password, child.password);
    if (!valid) throw new UnauthorizedException('Incorrect password');

    return child;
  }

  async getParentProfile(userId: string) {
  const parent = await this.parentModel
    .findById(userId)
    .populate('child'); // pour voir les enfants liés
  if (!parent) throw new UnauthorizedException('Parent not found');
  return parent;
}

async getChildProfile(userId: string) {
  const child = await this.childModel
    .findById(userId)
    .populate('parentId'); // pour voir le parent lié
  if (!child) throw new UnauthorizedException('Child not found');
  return child;
}


  async loginUser(payload: { id: string; role: string }) {
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  async loginParent(email: string, password: string) {
    const parent = await this.validateParent(email, password);
    return this.loginUser({ id: parent._id.toString(), role: 'parent' });
  }

  async loginChild(username: string, password: string) {
    const child = await this.validateChild(username, password);
    return this.loginUser({ id: child._id.toString(), role: 'child' });
  }
 async register(data: RegisterDto) {
    const { username, password, confirmPassword, age, email, phone } = data;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Vérifier les doublons
    const existingParent = await this.parentModel.findOne({ email });
    if (existingParent) throw new ConflictException('Email already in use');

    const existingChild = await this.childModel.findOne({ username });
    if (existingChild) throw new ConflictException('Username already in use');

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Créer le parent
    const parent = await this.parentModel.create({
      email,
      phone,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${email}`,
    });

    // 2️⃣ Créer l’enfant et lui lier le parent
    const child = await this.childModel.create({
      username,
      password: hashedPassword,
      age,
      avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${username}`,
      parentId: parent._id,
    });

    // 3️⃣ Lier l’enfant au parent
    parent.child = child._id;
    await parent.save();

    // 4️⃣ Envoyer l’email au parent
    console.log('Envoi email à', email);
    await this.emailService.sendRegistrationEmail(email, username);

    return {
      message: 'Registration successful',
      parentId: parent._id,
      childId: child._id,
    };
  }
  //  Modifier le username et l’âge d’un enfant
async updateChildProfile(childId: string, username?: string, age?: number) {
  const child = await this.childModel.findById(childId);
  if (!child) throw new NotFoundException('Child not found');

  if (username) child.username = username;
  if (age) child.age = age;

  await child.save();

  return {
    message: 'Child profile updated successfully',
    child,
  };
}
  //  Modifier le mot de passe d’un parent et de son enfant
  async updateParentPassword(
  parentId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const parent = await this.parentModel.findById(parentId).populate('child');

  if (!parent) throw new NotFoundException('Parent not found');

  const isMatch = await bcrypt.compare(oldPassword, parent.password);
  if (!isMatch) throw new BadRequestException('Old password is incorrect');

  if (newPassword !== confirmPassword)
    throw new BadRequestException('New password and confirmation do not match');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 🔹 Mise à jour du parent
  parent.password = hashedPassword;
  await parent.save();

  // 🔹 Mise à jour automatique du mot de passe de son enfant
  if (parent.child) {
    const child = await this.childModel.findById(parent.child._id);
    if (child) {
      child.password = hashedPassword;
      await child.save();
    }
  }

  return { message: 'Password updated successfully for parent and child' };
}

// 🔹 Étape 1 : Demander un code de réinitialisation
  async requestPasswordReset(email: string) {
    const parent = await this.parentModel.findOne({ email });
    if (!parent) {
      throw new NotFoundException('Email not found');
    }

    // Générer un code à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes d'expiration

    parent.resetPasswordCode = resetCode;
    parent.resetPasswordExpires = expires;
    await parent.save();

    // Envoyer le code par email
    await this.emailService.sendResetCodeEmail(email, resetCode);

    return { 
      message: 'Reset code sent to your email',
      expiresIn: '15 minutes'
    };
  }

  // 🔹 Étape 2 : Vérifier le code de réinitialisation
  async verifyResetCode(email: string, code: string) {
    const parent = await this.parentModel.findOne({ 
      email, 
      resetPasswordCode: code 
    });

    if (!parent) {
      throw new BadRequestException('Invalid code');
    }

    if (!parent.resetPasswordExpires || parent.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Code expired. Please request a new one');
    }

    return { 
      message: 'Code verified successfully',
      valid: true 
    };
  }

  // 🔹 Étape 3 : Réinitialiser le mot de passe
  async resetPassword(
    email: string, 
    code: string, 
    newPassword: string, 
    confirmPassword: string
  ) {
    // Vérifier que le code est valide
    const parent = await this.parentModel.findOne({ 
      email, 
      resetPasswordCode: code 
    });

    if (!parent) {
      throw new BadRequestException('Invalid code');
    }

    if (!parent.resetPasswordExpires || parent.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Code expired. Please request a new one');
    }

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Valider la force du mot de passe
    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    parent.password = hashedPassword;
    parent.resetPasswordCode = undefined;
    parent.resetPasswordExpires = undefined;

    // Mettre à jour aussi le mot de passe de l'enfant
    if (parent.child) {
      const child = await this.childModel.findById(parent.child);
      if (child) {
        child.password = hashedPassword;
        await child.save();
      }
    }

    await parent.save();

    return { 
      message: 'Password reset successfully',
      success: true 
    };
  }

  // 🔹 Update parent profile!
async updateParentProfile(parentId: string, email?: string, phone?: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  if (email) parent.email = email;
  if (phone) parent.phone = phone;

  await parent.save();

  return {
    message: 'Parent profile updated successfully',
    parent,
  };
}
}

