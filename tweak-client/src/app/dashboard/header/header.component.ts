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
    <div class="flex justify-between space-x-1">
      <div
        fxLayout.gt-lg="space-around center"
        fxLayout="start center"
        fxLayoutGap="20px"
        class="m-auto text-[36px] font-bold"
      >
        <div fxLayout="start center" fxLayoutGap="20px">
          <button
            (click)="onWeekToggleClicked({ type: 'prev' })"
            class="m-auto border hover:bg-gray-200 font-semibold border-black rounded p-2"
          >
            <img src="assets/left-arrow.svg" class="w-5 h-5" />
          </button>
          <button
            (click)="onWeekToggleClicked({ type: 'next' })"
            class="m-auto border hover:bg-gray-200 font-semibold border-black rounded p-2"
          >
            <img src="assets/right-arrow.svg" class="w-5 h-5" />
          </button>
        </div>

        <div class="m-auto" *ngIf="monthWithYear$ | async as data">
          <span>{{ 'CALENDER.MONTHS.' + data.month | translate }} {{ data.year }}</span>
        </div>
      </div>
      <div class="m-auto flex-1"></div>

        <div class="m-auto flex items-center space-x-4">
          <button [matMenuTriggerFor]="langMenu" class="flex items-center space-x-1 uppercase text-sm font-medium border border-gray-300 rounded px-2 py-1">
            <span>{{ translate.currentLang }}</span>
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">language</mat-icon>
          </button>
          <mat-menu #langMenu="matMenu">
            <button mat-menu-item (click)="useLanguage('en')">English</button>
            <button mat-menu-item (click)="useLanguage('es')">Español</button>
          </mat-menu>

          <button [matMenuTriggerFor]="menu">@{{ currentUsername }} 👋 </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="onRollover()">{{ 'HEADER.MOVE_UNFINISHED' | translate }}</button>
            <button mat-menu-item (click)="onLogout()">{{ 'HEADER.LOGOUT' | translate }}</button>
          </mat-menu>
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
    this.translate.use(language);
    localStorage.setItem('lang', language);
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
