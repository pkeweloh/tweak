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

  private monthWithYearSubject: BehaviorSubject<{ month: number, year: number }>;
  public monthWithYear$: Observable<{ month: number, year: number }>;

  private calendarWeekSubject: BehaviorSubject<Array<Date>>;
  public calenderWeek$: Observable<Array<Date>>;

  private isCurrentWeekSubject: BehaviorSubject<boolean>;
  public isCurrentWeek$: Observable<boolean>;

  constructor() {
    this.currentWeekStartDate = this.getMonday(new Date());
    this.weekStartDate = new Date(this.currentWeekStartDate);
    this.weekEndDate = this.addDays(this.weekStartDate, 6);

    this.calendarWeekSubject = new BehaviorSubject<Array<Date>>(
      this.generateWeek(this.weekStartDate)
    );
    this.calenderWeek$ = this.calendarWeekSubject.asObservable();

    this.monthWithYearSubject = new BehaviorSubject(this.getCurrentMonthAndYear());
    this.monthWithYear$ = this.monthWithYearSubject.asObservable();

    this.isCurrentWeekSubject = new BehaviorSubject(
      this.isSameWeekStart(this.weekStartDate, this.currentWeekStartDate)
    );
    this.isCurrentWeek$ = this.isCurrentWeekSubject.asObservable();
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
    this.monthWithYearSubject.next(this.getCurrentMonthAndYear());
    this.isCurrentWeekSubject.next(
      this.isSameWeekStart(this.weekStartDate, this.currentWeekStartDate)
    );
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

  public getCurrentMonthAndYear(): { month: number, year: number } {
    return {
      month: this.weekStartDate.getMonth(),
      year: this.weekStartDate.getFullYear()
    };
  }

  private isSameWeekStart(left: Date, right: Date): boolean {
    return left.toDateString() === right.toDateString();
  }
}
