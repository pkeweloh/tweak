import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptorService } from './shared/services/auth-interceptor.service';
import { AuthService } from './shared/services/auth.service';
import { MaterialModule } from './material/material.module';
import { DatepickerLocaleService } from './shared/intl/datepicker-locale.service';
import { TranslateDatepickerIntl } from './shared/intl/translate-datepicker-intl.service';

registerLocaleData(localeEs, 'es-ES');

export function localeIdFactory(): string {
  const locale = resolveLocaleFromStorage() ?? resolveLocaleFromNavigator();
  return locale ?? DEFAULT_LOCALE;
}

const DEFAULT_LOCALE = 'en-US';
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
};

function resolveLocaleFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const savedLang = window.localStorage.getItem('lang');
  return mapLanguageToLocale(savedLang);
}

function resolveLocaleFromNavigator(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const userLang = navigator.language || navigator.languages?.[0];
  return mapLanguageToLocale(userLang);
}

function mapLanguageToLocale(rawLang?: string | null): string | undefined {
  if (!rawLang) return undefined;
  const normalized = rawLang.toLowerCase();
  if (LANGUAGE_LOCALE_MAP[normalized]) return LANGUAGE_LOCALE_MAP[normalized];
  const base = normalized.split('-')[0];
  return LANGUAGE_LOCALE_MAP[base];
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    AuthService,
    AuthGuard,
    DatepickerLocaleService,
    {
      provide: LOCALE_ID,
      useFactory: localeIdFactory,
    },
    {
      provide: MAT_DATE_LOCALE,
      useFactory: localeIdFactory,
    },
    {
      provide: MatDatepickerIntl,
      useClass: TranslateDatepickerIntl,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
