import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

export const DEFAULT_USER_SETTINGS = {
  language: 'en',
  weekStartsOn: 'monday',
  dateFormat: 'DD-MM',
  calendarFeedDays: 30,
} as const;

export const CALENDAR_FEED_DAYS = [7, 14, 30, 90] as const;

@Schema({ collection: 'users' })
export class User {
  @Prop({
    type: SchemaTypes.String,
    required: true,
    index: 'hashed',
    unique: true,
    lowercase: true,
  })
  username: string;

  @Prop({ type: SchemaTypes.String, required: true })
  password: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['en', 'es', 'de'],
    default: DEFAULT_USER_SETTINGS.language,
  })
  language: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['monday', 'sunday'],
    default: DEFAULT_USER_SETTINGS.weekStartsOn,
  })
  weekStartsOn: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['DD-MM', 'MM-DD'],
    default: DEFAULT_USER_SETTINGS.dateFormat,
  })
  dateFormat: string;

  @Prop({
    type: SchemaTypes.Number,
    default: DEFAULT_USER_SETTINGS.calendarFeedDays,
  })
  calendarFeedDays: number;

  @Prop({ type: SchemaTypes.String, default: null, index: true, sparse: true })
  calendarToken: string | null;

  @Prop({ type: SchemaTypes.Date, default: () => Date.now() })
  createdAt: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
