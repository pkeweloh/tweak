import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class WeekStartDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    if (typeof window === 'undefined') {
      return 1;
    }

    try {
      const storedUser = window.localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed?.settings?.weekStartsOn === 'sunday' ? 0 : 1;
      }
    } catch {}

    return 1;
  }
}
