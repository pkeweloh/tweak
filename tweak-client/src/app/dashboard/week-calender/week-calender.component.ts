import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CalendarService } from 'src/app/shared/services/calendar.service';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { DragSropShareService } from './drag-share.service';

@Component({
  selector: 'app-week-calender',
  template: `
    <div class="my-3 p-2 overflow-x-auto">
      <div class="grid-6-col" cdkDropListGroup>
        <!-- Weekdays (Mon-Fri) -->
        <div
          *ngFor="let date of weekDays.slice(0, 5); let indx = index"
          [attr.data-index]="indx"
        >
          <div
            [class]="
              'flex flex-row items-baseline border-b-2 py-2 px-1' +
              setTodaysColor(date)
            "
            style="letter-spacing: -0.5px;"
          >
            <div class="font-bold text-[21px]">
              {{ date | date: 'd MMM' | lowercase }}
            </div>
            <div class="flex-1"></div>
            <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
              {{ date | date: 'EE' | lowercase }}
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
        <div>
          <!-- Saturday -->
          <ng-container *ngIf="weekDays[5] as date">
            <div
              [class]="
                'flex flex-row items-baseline border-b-2 py-2 px-1' +
                setTodaysColor(date)
              "
              style="letter-spacing: -0.5px;"
            >
              <div class="font-bold text-[21px]">
                {{ date | date: 'd MMM' | lowercase }}
              </div>
              <div class="flex-1"></div>
              <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
                {{ date | date: 'EE' | lowercase }}
              </div>
            </div>
            <app-daily-todo
              [date]="date"
              [generatedIds]="generatedIds"
              [connectedIndex]="5"
              [maxRows]="satMaxRows"
            ></app-daily-todo>
          </ng-container>

          <!-- Sunday -->
          <ng-container *ngIf="weekDays[6] as date">
            <div
              [class]="
                'flex flex-row items-baseline border-b-2 py-2 px-1' +
                setTodaysColor(date)
              "
              style="letter-spacing: -0.5px;"
            >
              <div class="font-bold text-[21px]">
                {{ date | date: 'd MMM' | lowercase }}
              </div>
              <div class="flex-1"></div>
              <div [class]="'text-[21px] capitalize ' + setTodaysColorByOpacity(date)">
                {{ date | date: 'EE' | lowercase }}
              </div>
            </div>
            <app-daily-todo
              [date]="date"
              [generatedIds]="generatedIds"
              [connectedIndex]="6"
              [maxRows]="sunMaxRows"
            ></app-daily-todo>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./week-calender.component.css'],
})
export class WeekCalenderComponent implements OnInit {
  weekDays: Date[] = [];
  subscriptions: Array<Subscription> = [];
  date: Date = new Date();
  generatedIds: Array<string> = [];
  wdMaxRows: number = 10;
  satMaxRows: number = 4;
  sunMaxRows: number = 5;

  constructor(
    private readonly weekSchedulerService: WeekSchedulerService,
    private calendarService: CalendarService,
    private snackbar: MatSnackBar,
    private dragDropService: DragSropShareService
  ) { }

  ngOnInit(): void {
    this.registerSubscriptions(() =>
      this.calendarService.calenderWeek$.subscribe((dates) => {
        this.weekDays = [...dates];
        this.generatedIds = [];
        this.weekDays.forEach((week) => {
          this.generatedIds.push(this.getUniqueId(week));
        });
      })
    );

    this.registerSubscriptions(() =>
      this.weekSchedulerService.weekSchedules$.subscribe((data) => {
        if (!this.weekDays.length) return;

        const counts = this.weekDays.map(d => (data[d.toDateString()] || []).length);
        const countsPlusInput = counts.map(c => c + 1);

        const wdCount = Math.max(10, ...countsPlusInput.slice(0, 5));
        const satCount = Math.max(4, countsPlusInput[5]);
        const sunCount = Math.max(5, countsPlusInput[6]);

        // Squeeze Sunday to 4 if Saturday needs space and Sunday can spare it
        let effectiveSunCount = sunCount;
        if (satCount > 4 && countsPlusInput[6] <= 4) {
          effectiveSunCount = 4;
        }

        // Total Slots calculation:
        // Sat side = 1 (Sat Head) + satCount + 1 (Sun Head) + effectiveSunCount
        const satSideTotal = 1 + satCount + 1 + effectiveSunCount;
        const wdSideTotal = 1 + wdCount;

        const totalHeight = Math.max(wdSideTotal, satSideTotal);

        this.wdMaxRows = totalHeight - 1;
        this.satMaxRows = satCount;
        this.sunMaxRows = totalHeight - 1 - this.satMaxRows - 1; // total - SatHead - satCount - SunHead
      })
    );

    this.weekSchedulerService.refreshState();
    this.snackbar.open('Appstate Refreshed', 'Done', {
      duration: 3000,
      panelClass: ['bg-[#5167F4]', 'text-white'],
    });
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
      : ' text-gray-800 border-black';
  }

  setTodaysColorByOpacity(date: Date) {
    return date.toDateString() === new Date().toDateString()
      ? ' text-[#5167F4] opacity-40'
      : ' text-black opacity-20';
  }
}
