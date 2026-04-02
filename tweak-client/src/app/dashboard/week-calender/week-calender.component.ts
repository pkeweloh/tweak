import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService, UserSettings } from 'src/app/shared/services/auth.service';
import { CalendarService } from 'src/app/shared/services/calendar.service';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { DragSropShareService } from './drag-share.service';

@Component({
  selector: 'app-week-calender',
  template: `
    <div class="px-6 pt-12 pb-1 overflow-x-auto overflow-y-hidden">
      <div class="grid-6-col" cdkDropListGroup>
        <!-- Weekdays (Mon-Fri) -->
        <div
          *ngFor="let date of weekDays.slice(0, 5); let indx = index"
          [attr.data-index]="indx"
        >
          <div
            [class]="
              'flex flex-row items-baseline border-b-2 h-[42px] box-border' +
              setTodaysColor(date)
            "
              style="padding-bottom: 12px; display: flex; line-height: 28px;"
          >
            <div class="font-bold text-[21px]" style="letter-spacing: -0.5px;">
              {{ date | date: calendarHeaderDateFormat : undefined : currentLocale }}
            </div>
            <div class="flex-1"></div>
            <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
                {{ date | date: 'EEE' : undefined : currentLocale | titlecase }}
            </div>
          </div>
          <app-daily-todo
            [date]="date"
            [generatedIds]="generatedIds"
            [connectedIndex]="indx"
            [maxRows]="wdMaxRows"
          ></app-daily-todo>
        </div>

        <!-- Weekend (Sat & Sun) -->
        <div class="flex flex-col h-full gap-[42px]">
          <!-- Saturday -->
          <ng-container *ngIf="weekDays[5] as date">
            <div class="flex-none overflow-hidden">
              <div
                [class]="
                  'flex flex-row items-baseline border-b-2 h-[42px] box-border' +
                  setTodaysColor(date)
                "
                style="padding-bottom: 12px; display: flex; line-height: 28px;"
              >
                <div class="font-bold text-[21px]" style="letter-spacing: -0.5px;">
                  {{ date | date: calendarHeaderDateFormat : undefined : currentLocale }}
                </div>
                <div class="flex-1"></div>
                <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
                {{ date | date: 'EEE' : undefined : currentLocale | titlecase }}
                </div>
              </div>
              <app-daily-todo
                [date]="date"
                [generatedIds]="generatedIds"
                [connectedIndex]="5"
                [maxRows]="satMaxRows"
              ></app-daily-todo>
            </div>
          </ng-container>

          <!-- Sunday -->
          <ng-container *ngIf="weekDays[6] as date">
            <div class="flex-1 flex flex-col h-full">
              <div
                [class]="
                  'flex flex-row items-baseline border-b-2 h-[42px] box-border' +
                  setTodaysColor(date)
                "
                style="padding-bottom: 12px; display: flex; line-height: 28px;"
              >
                <div class="font-bold text-[21px]" style="letter-spacing: -0.5px;">
                  {{ date | date: calendarHeaderDateFormat : undefined : currentLocale }}
                </div>
                <div class="flex-1"></div>
                <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
                  {{ date | date: 'EEE' : undefined : currentLocale | titlecase }}
                </div>
              </div>
              <app-daily-todo
                class="flex-grow"
                [date]="date"
                [generatedIds]="generatedIds"
                [connectedIndex]="6"
                [maxRows]="sunMaxRows"
              ></app-daily-todo>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Someday Section Separator Block -->
      <div class="w-full bg-white relative pt-6 pb-3 mt-4" style="padding-top: 1.63rem; padding-bottom: 0.68rem;">
        <span class="font-bold text-black opacity-20 tracking-wide" style="font-family: 'SuisseIntl'; font-size: 21px; letter-spacing: -.5px;">{{ 'CALENDER.SOMEDAY' | translate }}</span>
      </div>
      
      <div class="grid-6-col" cdkDropListGroup>
        <!-- Someday lists -->
        <ng-container *ngFor="let somedayId of somedayLists; let i = index">
          <div class="col-span-2 flex flex-col border-t border-[#e5e7eb]">
            <app-daily-todo
              class="flex-1"
              [date]="date"
              [listId]="somedayId"
              [generatedIds]="generatedIds"
              [connectedIndex]="10 + i"
              [maxRows]="1"
            ></app-daily-todo>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./week-calender.component.css'],
})
export class WeekCalenderComponent implements OnInit, OnDestroy {
  weekDays: Date[] = [];
  somedayLists: string[] = ['Someday-0', 'Someday-1', 'Someday-2'];
  subscriptions: Array<Subscription> = [];
  date: Date = new Date();
  generatedIds: Array<string> = [];
  wdMaxRows: number = 10;
  satMaxRows: number = 4;
  sunMaxRows: number = 4;
  currentLocale: string = 'en-US';
  calendarHeaderDateFormat: string = 'd MMM';

  constructor(
    private readonly weekSchedulerService: WeekSchedulerService,
    private calendarService: CalendarService,
    private snackbar: MatSnackBar,
    private dragDropService: DragSropShareService,
    private translate: TranslateService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.applyUserSettings(this.authService.userAuthState.settings);

    this.registerSubscriptions(() =>
      this.calendarService.calenderWeek$.subscribe((dates) => {
        this.weekDays = [...dates];
        this.generatedIds = [];
        this.weekDays.forEach((week) => {
          this.generatedIds.push(this.getUniqueId(week));
        });
        this.somedayLists.forEach(list => this.generatedIds.push(`ID@${list}`));
      })
    );

    this.registerSubscriptions(() =>
      this.weekSchedulerService.weekSchedules$.subscribe((data) => {
        if (!this.weekDays.length) return;
        this.wdMaxRows = 10;
        this.satMaxRows = 4;
        this.sunMaxRows = 4;
      })
    );

    this.registerSubscriptions(() =>
      this.authService.user$.subscribe((authState) => {
        this.applyUserSettings(authState.settings);
      })
    );

    this.weekSchedulerService.refreshState();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private registerSubscriptions(callback: Function) {
    return this.subscriptions.push(callback());
  }

  onDropped(event: CdkDragDrop<any>) {
    this.dragDropService.drop(event);
  }

  getUniqueId(date: Date) {
    return `ID@${date.toDateString()}`;
  }

  setTodaysColor(date: Date) {
    return date.toDateString() === new Date().toDateString()
      ? ' text-[#5167F4] border-[#5167F4]'
      : ' text-black-800 border-black';
  }

  setTodaysColorByOpacity(date: Date) {
    return date.toDateString() === new Date().toDateString()
      ? ' text-[#5167F4] opacity-40'
      : ' text-black opacity-20';
  }

  private applyUserSettings(settings: UserSettings) {
    this.currentLocale = settings.language === 'es' ? 'es-ES' : 'en-US';
    this.calendarHeaderDateFormat =
      settings.dateFormat === 'MM-DD' ? 'MMM d' : 'd MMM';
  }
}
