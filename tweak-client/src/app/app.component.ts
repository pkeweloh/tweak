import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DatepickerLocaleService } from './shared/intl/datepicker-locale.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'tweak-client';

  constructor(
    private translate: TranslateService,
    private datepickerLocaleService: DatepickerLocaleService
  ) {
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translate.use(savedLang);
  }

  ngOnInit(): void {}
}
