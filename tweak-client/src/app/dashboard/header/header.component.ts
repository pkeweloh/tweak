import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  CalendarService,
  WeekGenerationType,
} from 'src/app/shared/services/calendar.service';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AccountDialogComponent } from './account-dialog.component';

@Component({
  selector: 'app-header',
  template: `
    <div class="header-container">
      <ng-container *ngIf="monthWithYear$ | async as data">
        <button
          *ngIf="(isCurrentWeek$ | async) === false; else currentWeekLabel"
          type="button"
          class="month-year month-year--link"
          (click)="goToCurrentWeek()"
        >
          {{ formatMonthYear(data.month, data.year) }}
        </button>
        <ng-template #currentWeekLabel>
          <div class="month-year">
            {{ formatMonthYear(data.month, data.year) }}
          </div>
        </ng-template>
      </ng-container>

      <div class="action-buttons">
        <div class="button-group-main">
          <!-- Profile Button -->
          <button 
            class="circle-btn btn-profile" 
            [matMenuTriggerFor]="profileMenu"
            [matTooltip]="'HEADER.PROFILE' | translate"
          >
            <mat-icon>person</mat-icon>
          </button>
          <mat-menu #profileMenu="matMenu" panelClass="custom-menu-panel">
            <div class="px-4 py-2 text-sm font-bold border-b">@{{ currentUsername }}</div>
            <button mat-menu-item (click)="openAccountDialog()">
              <div class="flex items-center w-full">
                <i class="fa fa-user-cog menu-item-icon" aria-hidden="true"></i>
                <span>{{ 'HEADER.ACCOUNT' | translate }}</span>
              </div>
            </button>
            <button mat-menu-item (click)="onLogout()">
              <div class="flex items-center w-full">
                <i class="fa fa-door-open menu-item-icon" aria-hidden="true"></i>
                <span>{{ 'HEADER.LOGOUT' | translate }}</span>
              </div>
            </button>
          </mat-menu>

          <!-- Options Button -->
          <button 
            class="circle-btn btn-options" 
            [matMenuTriggerFor]="optionsMenu"
          >
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #optionsMenu="matMenu" panelClass="custom-menu-panel">
            <button mat-menu-item (click)="onRollover()">
              <div class="flex items-center w-full">
                <i class="fa fa-rotate-right menu-item-icon" aria-hidden="true"></i>
                <span>{{ 'HEADER.MOVE_UNFINISHED' | translate }}</span>
              </div>
            </button>
            <div class="menu-separator"></div>
            <button mat-menu-item [matMenuTriggerFor]="langSubMenu">
              <div class="flex items-center w-full">
                <i class="fa fa-language menu-item-icon" aria-hidden="true"></i>
                <span>{{ 'COMMON.LANGUAGE' | translate }}</span>
              </div>
            </button>
          </mat-menu>

          <mat-menu #langSubMenu="matMenu" panelClass="custom-menu-panel">
            <button mat-menu-item (click)="useLanguage('en')">English</button>
            <button mat-menu-item (click)="useLanguage('es')">Español</button>
            <button mat-menu-item (click)="useLanguage('de')">Deutsch</button>
          </mat-menu>
        </div>

        <div class="button-group-nav">
          <!-- Navigation Buttons -->
          <button (click)="onWeekToggleClicked({ type: 'prev' })" class="circle-btn btn-nav">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button (click)="onWeekToggleClicked({ type: 'next' })" class="circle-btn btn-nav">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  currentUsername: string = 'sounish';
  monthWithYear$: Observable<{ month: number, year: number }>;
  isCurrentWeek$: Observable<boolean>;

  /**
   *
   * @param param0 { type }: { type: 'prev' | 'next' }
   * @memberof HeaderComponent
   * @description
   *
   *
   */

  private onPreviousClicked() {
    this.calendarService.generateWeekDates(WeekGenerationType.PAST_WEEK);
    this.weekSchedulerService.refreshState();
  }

  private onNextClicked() {
    this.calendarService.generateWeekDates(WeekGenerationType.NEXT_WEEK);
    this.weekSchedulerService.refreshState();
  }

  public onWeekToggleClicked({ type }: { type: 'prev' | 'next' }): void {
    return type === 'prev' ? this.onPreviousClicked() : this.onNextClicked();
  }

  goToCurrentWeek() {
    this.calendarService.generateWeekDates(WeekGenerationType.CURRENT);
    this.weekSchedulerService.refreshState();
  }

  /**
   *
   * @param calendarService
   */
  constructor(
    private readonly authService: AuthService,
    private readonly calendarService: CalendarService,
    private readonly weekSchedulerService: WeekSchedulerService,
    private snackbar: MatSnackBar,
    public translate: TranslateService,
    private dialog: MatDialog
  ) {
    this.currentUsername = this.authService.userAuthState.username;
    this.monthWithYear$ = this.calendarService.monthWithYear$;
    this.isCurrentWeek$ = this.calendarService.isCurrentWeek$;
  }

  ngOnInit(): void { }

  useLanguage(language: string) {
    this.authService.updateSettings({ language: language as 'en' | 'es' | 'de' }).subscribe({
      next: () => {
        this.translate.use(language);
        window.location.reload();
      },
    });
  }

  openAccountDialog() {
    this.dialog.open(AccountDialogComponent, {
      width: '360px',
      autoFocus: false,
      panelClass: 'dialog-panel',
    });
  }

  onLogout() {
    this.authService.logout();
  }

  onRollover() {
    this.weekSchedulerService.triggerRollover().subscribe((response: any) => {
      const count = response.count || 0;
      
      const translationKey = count > 0 ? 'HEADER.ROLLOVER_COMPLETE' : 'HEADER.NO_UNFINISHED';
      this.translate.get(translationKey, { count }).subscribe((message: string) => {
        this.snackbar.open(message, this.translate.instant('COMMON.OK'), { duration: 3000 });
      });
    });
  }

  formatMonthYear(month: number, year: number) {
    const localeMap: Record<string, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' };
    const locale = localeMap[this.authService.userAuthState.settings.language] ?? 'en-US';

    const monthLabel = new Intl.DateTimeFormat(locale, {
      month: 'long',
    }).format(new Date(year, month, 1));

    return `${monthLabel} ${year}`;
  }
}
