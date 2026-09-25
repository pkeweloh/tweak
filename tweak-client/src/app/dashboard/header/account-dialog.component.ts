import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {
  AuthService,
  CALENDAR_FEED_DAYS,
  UserSettings,
} from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-account-dialog',
  template: `
    <div class="account-dialog">
      <div class="account-dialog__header">
        <div class="account-dialog__title">{{ 'HEADER.ACCOUNT' | translate }}</div>
        <div class="account-dialog__subtitle">@{{ authService.userAuthState.username }}</div>
      </div>

      <form [formGroup]="form" class="account-dialog__body">
        <div class="setting-row">
          <label class="setting-row__label" for="account-language">
            {{ 'COMMON.LANGUAGE' | translate }}
          </label>
          <div class="setting-select-wrap">
            <select
              id="account-language"
              class="setting-select"
              formControlName="language"
            >
              <option value="en">{{ 'COMMON.ENGLISH' | translate }}</option>
              <option value="es">{{ 'COMMON.SPANISH' | translate }}</option>
              <option value="de">{{ 'COMMON.GERMAN' | translate }}</option>
            </select>
            <i class="fa fa-chevron-down setting-select__icon" aria-hidden="true"></i>
          </div>
        </div>

        <div class="setting-row">
          <label class="setting-row__label" for="account-week-start">
            {{ 'COMMON.WEEK_STARTS_ON' | translate }}
          </label>
          <div class="setting-select-wrap">
            <select
              id="account-week-start"
              class="setting-select"
              formControlName="weekStartsOn"
            >
              <option value="monday">{{ 'COMMON.MONDAY' | translate }}</option>
              <option value="sunday">{{ 'COMMON.SUNDAY' | translate }}</option>
            </select>
            <i class="fa fa-chevron-down setting-select__icon" aria-hidden="true"></i>
          </div>
        </div>

        <div class="setting-row">
          <label class="setting-row__label" for="account-date-format">
            {{ 'COMMON.DATE_FORMAT' | translate }}
          </label>
          <div class="setting-select-wrap">
            <select
              id="account-date-format"
              class="setting-select"
              formControlName="dateFormat"
            >
              <option value="DD-MM">DD-MM</option>
              <option value="MM-DD">MM-DD</option>
            </select>
            <i class="fa fa-chevron-down setting-select__icon" aria-hidden="true"></i>
          </div>
        </div>

        <div class="setting-row">
          <label class="setting-row__label">
            {{ 'CALENDAR_FEED.TITLE' | translate }}
          </label>
          <div class="setting-row__hint">{{ 'CALENDAR_FEED.HINT' | translate }}</div>
          <ng-container *ngIf="feedToken; else feedOff">
            <input
              class="feed-url"
              readonly
              [value]="feedUrl"
              (focus)="$any($event.target).select()"
            />
            <div class="feed-actions">
              <button mat-button type="button" (click)="copyFeedUrl()">
                {{ (copied ? 'CALENDAR_FEED.COPIED' : 'CALENDAR_FEED.COPY') | translate }}
              </button>
              <button mat-button type="button" [disabled]="feedBusy" (click)="enableFeed()">
                {{ 'CALENDAR_FEED.REGENERATE' | translate }}
              </button>
              <button mat-button type="button" [disabled]="feedBusy" (click)="disableFeed()">
                {{ 'CALENDAR_FEED.DISABLE' | translate }}
              </button>
            </div>
          </ng-container>
          <ng-template #feedOff>
            <div class="feed-actions">
              <button mat-button type="button" [disabled]="feedBusy" (click)="enableFeed()">
                {{ 'CALENDAR_FEED.ENABLE' | translate }}
              </button>
            </div>
          </ng-template>
        </div>

        <div class="setting-row">
          <label class="setting-row__label" for="account-feed-days">
            {{ 'CALENDAR_FEED.COMPLETED_DAYS' | translate }}
          </label>
          <div class="setting-select-wrap">
            <select
              id="account-feed-days"
              class="setting-select"
              formControlName="calendarFeedDays"
            >
              <option *ngFor="let days of feedDaysOptions" [ngValue]="days">
                {{ 'CALENDAR_FEED.DAYS' | translate: { count: days } }}
              </option>
            </select>
            <i class="fa fa-chevron-down setting-select__icon" aria-hidden="true"></i>
          </div>
        </div>
      </form>

      <div class="account-dialog__actions">
        <button class="btn-cancel" mat-button (click)="dialogRef.close()">
          {{ 'COMMON.CANCEL' | translate }}
        </button>
        <button
          class="btn-save"
          mat-flat-button
          color="primary"
          [disabled]="saving"
          (click)="save()"
        >
          {{ 'COMMON.SAVE' | translate }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./account-dialog.component.css'],
})
export class AccountDialogComponent implements OnInit {
  saving = false;
  feedToken: string | null = null;
  feedBusy = false;
  copied = false;
  feedDaysOptions = CALENDAR_FEED_DAYS;

  form = new FormGroup({
    language: new FormControl(this.authService.userAuthState.settings.language),
    weekStartsOn: new FormControl(
      this.authService.userAuthState.settings.weekStartsOn
    ),
    dateFormat: new FormControl(
      this.authService.userAuthState.settings.dateFormat
    ),
    calendarFeedDays: new FormControl(
      this.authService.userAuthState.settings.calendarFeedDays
    ),
  });

  constructor(
    public authService: AuthService,
    public dialogRef: MatDialogRef<AccountDialogComponent>,
    private translate: TranslateService
  ) {}

  get feedUrl() {
    return `${window.location.origin}/api/calendar/${this.feedToken}/tweak.ics`;
  }

  ngOnInit() {
    this.authService.getCalendarFeed().subscribe(({ token }) => {
      this.feedToken = token;
    });
  }

  enableFeed() {
    this.updateFeed(this.authService.enableCalendarFeed());
  }

  disableFeed() {
    this.updateFeed(this.authService.disableCalendarFeed());
  }

  copyFeedUrl() {
    navigator.clipboard?.writeText(this.feedUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  private updateFeed(request: Observable<{ token: string | null }>) {
    this.feedBusy = true;
    request.subscribe({
      next: ({ token }) => {
        this.feedToken = token;
        this.copied = false;
      },
      error: () => {
        this.feedBusy = false;
      },
      complete: () => {
        this.feedBusy = false;
      },
    });
  }

  save() {
    if (this.saving) {
      return;
    }

    this.saving = true;
    const settings = this.form.getRawValue() as UserSettings;
    const languageChanged = settings.language !== this.translate.currentLang;

    this.authService.updateSettings(settings).subscribe({
      next: () => {
        this.translate.use(settings.language);
        this.dialogRef.close(settings);
        if (languageChanged) {
          window.location.reload();
        }
      },
      error: () => {
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      },
    });
  }
}
