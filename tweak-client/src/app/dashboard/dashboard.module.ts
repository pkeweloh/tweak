import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../material/material.module';
import { AuthService } from '../shared/services/auth.service';
import { CalendarService } from '../shared/services/calendar.service';
import { WeekSchedulerService } from '../shared/services/week-scheduler.service';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { AccountDialogComponent } from './header/account-dialog.component';
import { DashboardComponent } from './dashboard.component';
import { HeaderComponent } from './header/header.component';
import { AddFormComponent } from './week-calender/add-form/add-form.component';
import { DailyTodoComponent } from './week-calender/daily-todo/daily-todo.component';
import { DialoagboxComponent } from './week-calender/daily-todo/dialoagbox/dialoagbox.component';
import { DragSropShareService } from './week-calender/drag-share.service';
import { WeekCalenderComponent } from './week-calender/week-calender.component';

@NgModule({
  declarations: [
    DashboardComponent,
    HeaderComponent,
    AccountDialogComponent,
    WeekCalenderComponent,
    AddFormComponent,
    DailyTodoComponent,
    DialoagboxComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TranslateModule,
  ],
  providers: [AuthService, CalendarService, WeekSchedulerService, DragSropShareService],
})
export class DashboardModule {}
