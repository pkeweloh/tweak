import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum WeekGenerationType {
  CURRENT = '[CURRENT]',
  PAST_WEEK = '[PAST_WEEK]',
  NEXT_WEEK = '[NEXT_WEEK]',
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private currentWeekStartDate: Date;
  private weekStartDate: Date;
  private weekEndDate: Date;

  private readonly MONTHS_MAPPING = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  private monthWithYearSubject: BehaviorSubject<string>;
  public monthWithYear$: Observable<string>;

  private calendarWeekSubject: BehaviorSubject<Array<Date>>;
  public calenderWeek$: Observable<Array<Date>>;

  constructor() {
    this.currentWeekStartDate = this.getMonday(new Date());
    this.weekStartDate = new Date(this.currentWeekStartDate);
    this.weekEndDate = this.addDays(this.weekStartDate, 6);

    this.calendarWeekSubject = new BehaviorSubject<Array<Date>>(
      this.generateWeek(this.weekStartDate)
    );
    this.calenderWeek$ = this.calendarWeekSubject.asObservable();

    this.monthWithYearSubject = new BehaviorSubject(this.getCurrentMonthWithYear());
    this.monthWithYear$ = this.monthWithYearSubject.asObservable();
  }

  public generateWeekDates(type: WeekGenerationType) {
    if (type === WeekGenerationType.CURRENT) {
      this.weekStartDate = new Date(this.currentWeekStartDate);
    } else if (type === WeekGenerationType.NEXT_WEEK) {
      this.weekStartDate = this.addDays(this.weekStartDate, 7);
    } else if (type === WeekGenerationType.PAST_WEEK) {
      this.weekStartDate = this.addDays(this.weekStartDate, -7);
    }

    this.weekEndDate = this.addDays(this.weekStartDate, 6);
    this.calendarWeekSubject.next(this.generateWeek(this.weekStartDate));
    this.monthWithYearSubject.next(this.getCurrentMonthWithYear());
  }

  // --- Helper Methods ---

  private generateWeek(start: Date): Array<Date> {
    const dates: Array<Date> = [];
    for (let i = 0; i < 7; i++) {
      dates.push(this.addDays(start, i));
    }
    return dates;
  }

  private getMonday(d: Date): Date {
    d = new Date(d);
    var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0); // normalize time
    return monday;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private getCurrentMonth(): string {
    // If the week spans two months, show the month of the Thursday (middle of week)
    // or just the Start Date's month for simplicity. Tweek usually shows Start Date month.
    const monthIndex: number = this.weekStartDate.getMonth();
    return this.MONTHS_MAPPING[monthIndex];
  }

  public getCurrentMonthWithYear(): string {
    const month = this.getCurrentMonth();
    const year = this.weekStartDate.getFullYear(); // Use the week's year, not today's
    return `${month} ${year}`;
  }
}
