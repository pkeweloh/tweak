import { Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class DatepickerLocaleService {
  private readonly localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
  };

  constructor(private translate: TranslateService, private adapter: DateAdapter<Date>) {
    this.translate.onLangChange.subscribe(({ lang }) => {
      this.adapter.setLocale(this.toLocale(lang));
    });

    const initialLang = this.translate.currentLang || this.translate.defaultLang || 'en';
    this.adapter.setLocale(this.toLocale(initialLang));
  }

  private toLocale(lang: string): string {
    return this.localeMap[lang] ?? 'en-US';
  }
}
