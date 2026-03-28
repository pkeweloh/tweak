import { Injectable } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslateDatepickerIntl extends MatDatepickerIntl {
  private readonly translationKeys = [
    'CALENDER.DATE_PICKER.CALENDAR',
    'CALENDER.DATE_PICKER.OPEN_CALENDAR',
    'CALENDER.DATE_PICKER.PREVIOUS_MONTH',
    'CALENDER.DATE_PICKER.NEXT_MONTH',
    'CALENDER.DATE_PICKER.SWITCH_TO_MONTH_VIEW',
    'CALENDER.DATE_PICKER.SWITCH_TO_MULTI_YEAR_VIEW',
  ];

  constructor(private translate: TranslateService) {
    super();
    this.setLabels();
    this.translate.onLangChange.subscribe(() => this.setLabels());
  }

  private setLabels() {
    this.translate.get(this.translationKeys).subscribe((translation) => {
      this.calendarLabel = translation['CALENDER.DATE_PICKER.CALENDAR'];
      this.openCalendarLabel = translation['CALENDER.DATE_PICKER.OPEN_CALENDAR'];
      this.prevMonthLabel = translation['CALENDER.DATE_PICKER.PREVIOUS_MONTH'];
      this.nextMonthLabel = translation['CALENDER.DATE_PICKER.NEXT_MONTH'];
      this.switchToMonthViewLabel = translation['CALENDER.DATE_PICKER.SWITCH_TO_MONTH_VIEW'];
      this.switchToMultiYearViewLabel = translation['CALENDER.DATE_PICKER.SWITCH_TO_MULTI_YEAR_VIEW'];
      this.changes.next();
    });
  }
}
