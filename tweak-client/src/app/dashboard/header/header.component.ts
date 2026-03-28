import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  CalendarService,
  WeekGenerationType,
} from 'src/app/shared/services/calendar.service';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  template: `
    <div class="header-container">
      <div class="month-year" *ngIf="monthWithYear$ | async as data">
        {{ 'CALENDER.MONTHS.' + data.month | translate }} {{ data.year }}
      </div>

      <div class="action-buttons">
        <div class="button-group-main">
          <!-- Profile Button -->
          <button 
            class="circle-btn btn-profile" 
            [matMenuTriggerFor]="profileMenu"
            matTooltip="Profile"
          >
            <mat-icon>person</mat-icon>
          </button>
          <mat-menu #profileMenu="matMenu" panelClass="custom-menu-panel">
            <div class="px-4 py-2 text-sm font-bold border-b">@{{ currentUsername }}</div>
            <button mat-menu-item (click)="onLogout()">
              <div class="flex items-center justify-between w-full">
                <span>{{ 'HEADER.LOGOUT' | translate }}</span>
                <mat-icon class="ml-auto" style="margin-right: 0;">exit_to_app</mat-icon>
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
              <div class="flex items-center justify-between w-full">
                <span>{{ 'HEADER.MOVE_UNFINISHED' | translate }}</span>
                <mat-icon class="ml-auto" style="margin-right: 0;">autorenew</mat-icon>
              </div>
            </button>
            <div class="menu-separator"></div>
            <button mat-menu-item [matMenuTriggerFor]="langSubMenu">
              <div class="flex items-center w-full">
                <mat-icon>language</mat-icon>
                <span>{{ 'COMMON.LANGUAGE' | translate }}</span>
                <span class="ml-auto text-xs opacity-50">{{ translate.currentLang | uppercase }}</span>
              </div>
            </button>
          </mat-menu>

          <mat-menu #langSubMenu="matMenu" panelClass="custom-menu-panel">
            <button mat-menu-item (click)="useLanguage('en')">English</button>
            <button mat-menu-item (click)="useLanguage('es')">Español</button>
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

  /**
   *
   * @param calendarService
   */
  constructor(
    private readonly authService: AuthService,
    private readonly calendarService: CalendarService,
    private readonly weekSchedulerService: WeekSchedulerService,
    private snackbar: MatSnackBar,
    public translate: TranslateService
  ) {
    this.currentUsername = this.authService.userAuthState.username;
    this.monthWithYear$ = this.calendarService.monthWithYear$;
  }

  ngOnInit(): void { }

  useLanguage(language: string) {
    localStorage.setItem('lang', language);
    // this.translate.use(language);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  onLogout() {
    this.authService.logout();
  }

  onRollover() {
    this.weekSchedulerService.triggerRollover().subscribe((response: any) => {
      const count = response.count || 0;
      
      const translationKey = count > 0 ? 'HEADER.ROLLOVER_COMPLETE' : 'HEADER.NO_UNFINISHED';
      this.translate.get(translationKey, { count }).subscribe((message: string) => {
        this.snackbar.open(message, this.translate.instant('COMMON.DONE'), {
          duration: 3000,
          panelClass: ['bg-[#5167F4]', 'text-white'],
        });
      });
    });
  }
}
