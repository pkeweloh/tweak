import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  shareReplay,
  tap,
} from 'rxjs';
import { handleError } from 'src/app/shared/utils/error-handle.utils';

export type UserSettings = {
  language: 'en' | 'es';
  weekStartsOn: 'monday' | 'sunday';
  dateFormat: 'DD-MM' | 'MM-DD';
};

export type AuthState = {
  accessToken: string;
  isAuthenticated: boolean;
  username: string;
  settings: UserSettings;
};

export type AuthResponse = {
  accessToken: string;
  user: {
    username: string;
    language: UserSettings['language'];
    weekStartsOn: UserSettings['weekStartsOn'];
    dateFormat: UserSettings['dateFormat'];
  };
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'en',
  weekStartsOn: 'monday',
  dateFormat: 'DD-MM',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject: BehaviorSubject<AuthState>;
  public user$: Observable<AuthState>;

  constructor(private http: HttpClient) {
    this.userSubject = new BehaviorSubject<AuthState>(this.getStoredAuthState());

    this.user$ = this.userSubject.asObservable();
  }

  public get userAuthState(): AuthState {
    return this.userSubject.value;
  }

  signinWithUsernamePassword(username: string, password: string) {
    return this.http
      .post<AuthResponse>(
        `/api/auth/sign-in`,
        {
          username,
          password,
        },
        { withCredentials: true }
      )
      .pipe(
        shareReplay(),
        catchError(handleError),
        tap((response: AuthResponse) => {
          const authState = this.buildAuthenticatedState(response);
          this.persistAuthState(authState);
          return response;
        })
      );
  }

  signupWithUsernamePassword(username: string, password: string) {
    return this.http
      .post<AuthResponse>(
        `/api/auth/sign-up`,
        {
          username,
          password,
        },
        { withCredentials: true }
      )
      .pipe(
        shareReplay(),
        catchError(handleError),
        tap((response: AuthResponse) => {
          const authState = this.buildAuthenticatedState(response);
          this.persistAuthState(authState);
          return response;
        })
      );
  }

  fetchCurrentUserSettings() {
    return this.http.get<AuthResponse['user']>(`/api/auth/me`).pipe(
      shareReplay(),
      catchError(handleError),
      tap((user) => {
        const authState: AuthState = {
          ...this.userAuthState,
          isAuthenticated: true,
          username: user.username,
          settings: this.normalizeSettings(user),
        };
        this.persistAuthState(authState);
      })
    );
  }

  updateSettings(settings: Partial<UserSettings>) {
    return this.http.patch<AuthResponse['user']>(`/api/auth/settings`, settings).pipe(
      shareReplay(),
      catchError(handleError),
      tap((user) => {
        const authState: AuthState = {
          ...this.userAuthState,
          settings: this.normalizeSettings(user),
        };
        this.persistAuthState(authState);
      })
    );
  }

  getInitialLanguage(): UserSettings['language'] {
    return this.userAuthState.settings.language;
  }

  logout() {
    localStorage.clear();
    this.userSubject.next({
      isAuthenticated: false,
      username: '',
      accessToken: '',
      settings: { ...DEFAULT_USER_SETTINGS },
    });
    window.location.replace('/');
  }

  private getStoredAuthState(): AuthState {
    const storedRaw = localStorage.getItem('user');
    const legacyLang = localStorage.getItem('lang');

    if (!storedRaw) {
      return {
        accessToken: '',
        isAuthenticated: false,
        username: '',
        settings: {
          ...DEFAULT_USER_SETTINGS,
          language: legacyLang === 'es' ? 'es' : DEFAULT_USER_SETTINGS.language,
        },
      };
    }

    try {
      const stored = JSON.parse(storedRaw);
      const normalizedState: AuthState = {
        accessToken: stored.accessToken || '',
        isAuthenticated: !!stored.isAuthenticated,
        username: stored.username || '',
        settings: this.normalizeSettings(stored.settings || stored),
      };
      this.syncLanguageMirror(normalizedState.settings.language);
      return normalizedState;
    } catch {
      return {
        accessToken: '',
        isAuthenticated: false,
        username: '',
        settings: { ...DEFAULT_USER_SETTINGS },
      };
    }
  }

  private buildAuthenticatedState(response: AuthResponse): AuthState {
    return {
      accessToken: response.accessToken,
      isAuthenticated: true,
      username: response.user.username,
      settings: this.normalizeSettings(response.user),
    };
  }

  private normalizeSettings(settingsLike: Partial<UserSettings> & { language?: string; weekStartsOn?: string; dateFormat?: string }): UserSettings {
    return {
      language: settingsLike.language === 'es' ? 'es' : DEFAULT_USER_SETTINGS.language,
      weekStartsOn:
        settingsLike.weekStartsOn === 'sunday'
          ? 'sunday'
          : DEFAULT_USER_SETTINGS.weekStartsOn,
      dateFormat:
        settingsLike.dateFormat === 'MM-DD'
          ? 'MM-DD'
          : DEFAULT_USER_SETTINGS.dateFormat,
    };
  }

  private persistAuthState(authState: AuthState) {
    localStorage.setItem('user', JSON.stringify(authState));
    this.syncLanguageMirror(authState.settings.language);
    this.userSubject.next(authState);
  }

  private syncLanguageMirror(language: UserSettings['language']) {
    localStorage.setItem('lang', language);
  }
}
