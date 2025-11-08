import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Child extends Document {
  @ApiProperty({ description: 'Unique username', example: 'childuser' })
  @Prop({ required: true, unique: true })
  username: string;

  @ApiProperty({ description: 'Password', example: 'childPassword123' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: 'Age of the child', example: 10 })
  @Prop({ required: true })
  age: number;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://api.dicebear.com/9.x/bottts/svg?seed=childuser',
    required: false,
  })
  @Prop()
  avatar: string;

  // Référence vers le parent
  @ApiProperty({ description: 'Référence au parent', type: String })
  @Prop({ type: Types.ObjectId, ref: 'Parent' })
  parentId: Types.ObjectId;
}

export const ChildSchema = SchemaFactory.createForClass(Child);
