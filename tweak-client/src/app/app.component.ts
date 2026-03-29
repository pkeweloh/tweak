import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DatepickerLocaleService } from './shared/intl/datepicker-locale.service';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'tweak-client';

  constructor(
    private translate: TranslateService,
    private datepickerLocaleService: DatepickerLocaleService,
    private authService: AuthService
  ) {
    this.translate.use(this.authService.getInitialLanguage());
  }

  ngOnInit(): void {
    if (!this.authService.userAuthState.isAuthenticated) {
      return;
    }

    this.authService.fetchCurrentUserSettings().subscribe({
      next: (user) => {
        this.translate.use(user.language);
      },
      error: () => {},
    });
  }
}
