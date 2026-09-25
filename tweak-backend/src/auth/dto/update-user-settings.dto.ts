import { IsIn, IsOptional } from 'class-validator';
import { CALENDAR_FEED_DAYS } from '../schema/user.schema';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsIn(['en', 'es', 'de'])
  language?: 'en' | 'es' | 'de';

  @IsOptional()
  @IsIn(['monday', 'sunday'])
  weekStartsOn?: 'monday' | 'sunday';

  @IsOptional()
  @IsIn(['DD-MM', 'MM-DD'])
  dateFormat?: 'DD-MM' | 'MM-DD';

  @IsOptional()
  @IsIn([...CALENDAR_FEED_DAYS])
  calendarFeedDays?: number;
}
