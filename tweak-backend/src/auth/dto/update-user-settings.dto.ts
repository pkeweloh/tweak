import { IsIn, IsOptional } from 'class-validator';

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
}
