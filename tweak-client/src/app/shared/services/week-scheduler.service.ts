import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  share,
  shareReplay,
  Subject,
  Subscription,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Schedule, WeeklySchedulesInterface } from '../utils/types.utils';
import { AuthService } from './auth.service';
import { CalendarService } from './calendar.service';

type WeekScheduleMapType = Record<string, Array<Schedule>>;

@Injectable({
  providedIn: 'root',
})
export class WeekSchedulerService implements OnDestroy {
  private dates: Date[] = [];
  private weekScheduleMap: WeekScheduleMapType = {};
  subscription: Subscription;

  private weekScheduleMapSubject: BehaviorSubject<WeekScheduleMapType>;
  weekSchedules$: Observable<WeekScheduleMapType>;

  private updateStateSubject: Subject<void> = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private calendarService: CalendarService,
    private authService: AuthService
  ) {
    this.weekScheduleMapSubject = new BehaviorSubject<WeekScheduleMapType>({});
    this.weekSchedules$ = this.weekScheduleMapSubject.asObservable();

    this.subscription = this.calendarService.calenderWeek$.subscribe(
      (dates) => {
        this.dates = [...dates];
      }
    );

    this.updateStateSubject.subscribe(() => this.getSchedules());
  }

  refreshState() {
    this.updateStateSubject.next();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    console.warn('WeekScheduler Service Died...');
  }

  createSchedule(createSchedule: Partial<Schedule>) {
    const payload = {
      ...createSchedule,
      date: this.toServerDate(new Date(createSchedule.date!)),
    };
    return this.http
      .post(`/api/schedules/create`, payload)
      .pipe(tap(() => this.refreshState()));
  }

  getSchedules() {
    const { startDate, endDate } = this.getStartAndEndDate();

    if (!startDate || !endDate) {
      console.warn(`[getSchedules]: Deferred - dates not ready yet.`);
      return;
    }

    return this.http
      .get(`/api/schedules/find-by-week`, {
        params: {
          from: this.toServerDate(startDate),
          to: this.toServerDate(endDate),
        },
      })
      .pipe(shareReplay())
      .subscribe({
        next: (response: Partial<WeeklySchedulesInterface>) => {
          if (response.data) {
            this.weekScheduleMap = {}; // CLEARS OUT BUFFER
            response.data.forEach((object) => {
              this.weekScheduleMap[object.date] = [...object.schedules];
            });
            this.weekScheduleMapSubject.next({ ...this.weekScheduleMap });
            console.log(`[Refreshed]: Schedules Refreshed!`);
          }
        },
        error: (error) => {
          console.error(`[getSchedules Error]:`, error);
          if (error.status === 401) {
            this.authService.logout();
            window.location.replace('/');
          }
        },
      });
  }

  updateSchedule(updatedSchedule: Partial<Schedule>) {
    const { _id, colorCode, ...payload } = updatedSchedule;
    return this.http
      .patch(
        `/api/schedules/update`,
        { ...payload, colorCode: String(colorCode) },
        {
          params: { id: _id as string },
        }
      )
      .pipe(
        share(),
        tap(() => {
          this.refreshState();
        })
      );
  }

  deleteSchedule(schedule: Partial<Schedule>) {
    const { _id } = schedule;
    return this.http
      .delete(`/api/schedules/delete`, {
        params: { id: _id as string },
      })
      .pipe(
        share(),
        tap(() => {
          this.refreshState();
        })
      );
  }

  updateScheduleDatebyId(scheduleId: string, dateTobePushed: Date) {
    return this.http
      .patch(
        `/api/schedules/update-date`,
        { newDate: this.toServerDate(new Date(dateTobePushed)) },
        {
          params: { id: scheduleId },
        }
      )
      .pipe(
        share(),
        tap(() => {
          this.refreshState();
        })
      );
  }

  triggerRollover() {
    return this.http.post(`/api/schedules/rollover`, {}).pipe(
      tap(() => {
        this.refreshState();
      })
    );
  }

  private getStartAndEndDate() {
    return {
      startDate: this.dates[0],
      endDate: this.dates[this.dates.length - 1],
    };
  }

  /**
   * Helper to format Date to YYYY-MM-DD using Local Time
   * This avoids UTC shifting when sending to backend.
   */
  private toServerDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
