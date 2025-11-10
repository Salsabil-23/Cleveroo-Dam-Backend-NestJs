import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Child } from '../child/child.schema';

@Schema({ timestamps: true })
export class Parent extends Document {
  @ApiProperty({ description: 'Unique Email', example: 'john.doe@example.com' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'Unique Phone Number', example: '+1234567890' })
  @Prop({ required: true, unique: true })
  phone: string;

  @ApiProperty({ description: 'Password', example: 'strongPassword123' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: 'Avatar URL', example: 'https://api.dicebear.com/9.x/bottts/svg?seed=john@example.com' })
  @Prop()
  avatar: string;

  @ApiProperty({ description: "L'enfant lié à ce parent", type: String })
  @Prop({ type: Types.ObjectId, ref: 'Child', default: null })
  child: Types.ObjectId;

   @Prop()
  resetPasswordCode?: string;

  @Prop()
  resetPasswordExpires?: Date;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);
