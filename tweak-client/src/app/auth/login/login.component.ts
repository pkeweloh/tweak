import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="m-20" fxLayout="column" fxLayoutAlign="start center">
      <div fxLayout="column" fxLayoutAlign="start center" class="my-6">
        <h1 class="text-5xl font-bold my-2 text-black">{{ 'LOGIN.TITLE' | translate }}</h1>
        <div class="body-font text-gray-800">
          {{ 'LOGIN.SUBTITLE' | translate }}
        </div>
      </div>
      <form
        [formGroup]="form"
        fxLayout="column"
        fxLayoutGap="20px"
        class="w-600 login-form"
      >
        <mat-form-field appearance="fill">
          <mat-label> {{ 'LOGIN.USERNAME' | translate }} </mat-label>
          <mat-error
            *ngIf="
              usernameField?.hasError('username') &&
              !usernameField?.hasError('required')
            "
          >
            {{ 'LOGIN.USERNAME_REQUIRED_1' | translate }}
          </mat-error>
          <mat-error *ngIf="usernameField?.hasError('required')">
            <span [innerHTML]="'LOGIN.USERNAME_REQUIRED_2' | translate"></span>
          </mat-error>
          <input
            formControlName="username"
            matInput
            type="text"
          />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label> {{ 'LOGIN.PASSWORD' | translate }} </mat-label>
          <mat-error
            *ngIf="
              passwordField?.hasError('password') &&
              !passwordField?.hasError('required')
            "
          >
            {{ 'LOGIN.PASSWORD_REQUIRED_1' | translate }}
          </mat-error>
          <mat-error *ngIf="passwordField?.hasError('required')">
              <span [innerHTML]="'LOGIN.PASSWORD_REQUIRED_2' | translate"></span>
          </mat-error>
          <input
            formControlName="password"
            matInput
            type="password"
          />
        </mat-form-field>

        <div class="m-5" *ngIf="errors">
          <ul>
            <li *ngFor="let error of errors">
              <mat-error> {{ error }} </mat-error>
            </li>
          </ul>
        </div>
        <div class="flex justify-end">
          <button
            [disabled]="form.invalid"
            mat-flat-button
            [color]="isSignup ? 'accent' : 'primary'"
            (click)="isSignup ? onSignup() : onSignin()"
          >
            {{ (isSignup ? 'LOGIN.BTN_SIGNUP' : 'LOGIN.BTN_LOGIN') | translate }} &rarr;
          </button>
        </div>
        <div
          fxLayout="row"
          fxLayoutAlign="end center"
          fxLayoutGap="20px"
        >
          <div (click)="isSignup = !isSignup">
            {{ (isSignup ? 'LOGIN.ALREADY_HAVE' : 'LOGIN.DO_NOT_HAVE') | translate }}
            <span class="text-decor">
              {{ (isSignup ? 'LOGIN.BTN_LOGIN' : 'LOGIN.BTN_SIGNUP') | translate }}
            </span>
          </div>
          <div style="display: none">|</div>
          <div style="display: none">
            {{ 'LOGIN.FORGOT_PASSWORD' | translate }}
            <span class="text-decor">{{ 'LOGIN.RESET_PASSWORD' | translate }}</span>
          </div>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isSignup: boolean = false;
  form: FormGroup;
  usernameField: AbstractControl | null = null;
  passwordField: AbstractControl | null = null;

  errors: Array<string> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private readonly snackbar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });

    this.usernameField = this.form.get('username');
    this.passwordField = this.form.get('password');
  }

  ngOnInit(): void {
    const isAuthenticated: boolean =
      this.authService.userAuthState.isAuthenticated;
    if (isAuthenticated) {
      window.location.replace('/');
    }
  }

  onSignup() {
    const { username, password } = this.form.value;
    this.authService.signupWithUsernamePassword(username, password).subscribe({
      next: (response) => {
        this.translate.get('LOGIN.APP_STATE_REINIT').subscribe((res: string) => {
          this.snackbar.open(res, this.translate.instant('COMMON.DONE'), {
            duration: 3000,
          });
        });
        window.location.replace('/');
      },
      error: (error) => {
        const e = error.message;
        if (typeof e === 'string') {
          this.errors = [e];
          this.snackbar.open(e, this.translate.instant('COMMON.CANCEL'), {
            duration: 3000,
            panelClass: ['bg-red-600', 'text-white'],
          });
        } else {
          this.errors = [...(error.error.message || this.translate.instant('LOGIN.SOMETHING_WENT_WRONG'))];
        }
      },
    });
  }

  onSignin() {
    const { username, password } = this.form.value;
    this.authService.signinWithUsernamePassword(username, password).subscribe({
      next: (response) => {
        const { redirectTo } = this.route.snapshot.queryParams;
        this.translate.get('LOGIN.YOU_ARE_LOGGED_IN').subscribe((res: string) => {
          this.snackbar.open(res, this.translate.instant('COMMON.DONE'), {
            duration: 3000,
          });
        });
        window.location.replace(redirectTo || '/');
      },
      error: (error) => {
        const e = error.message;
        if (typeof e === 'string') {
          this.errors = [e];
          this.snackbar.open(e, this.translate.instant('COMMON.CANCEL'), {
            duration: 3000,
            panelClass: ['bg-red-600', 'text-white'],
          });
        } else {
          this.errors = [...(error.error.message || this.translate.instant('LOGIN.SOMETHING_WENT_WRONG'))];
        }
      },
    });
  }
}
