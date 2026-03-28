import { Component, ElementRef, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { ColorUtils } from 'src/app/shared/utils/colors.utils';
import { Schedule } from 'src/app/shared/utils/types.utils';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-dialoagbox',
  template: `
    <div class="dialog-container">
      <div class="dialog-header flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <div
            [ngClass]="[
              'w-6 h-6 rounded-full border dialog-color-circle',
              selectedColor()
            ]"
          ></div>
          <div class="text-xl font-bold text-gray-800">
            <ng-container *ngIf="!isSomedayTask; else somedayLabel">
              <button
                type="button"
                class="date-button"
                (click)="openDatepicker()"
              >
                <span>{{ scheduleData.date | date: 'dd.MM.YY' }}</span>
                <mat-icon>calendar_today</mat-icon>
              </button>
            </ng-container>
            <ng-template #somedayLabel>
              {{ 'CALENDER.SOMEDAY' | translate }}
            </ng-template>
          </div>
        </div>
        <div
          (click)="onDelete()"
          class="delete-btn p-2 rounded hover:bg-gray-200 cursor-pointer transition-colors"
        >
          <mat-icon style="color: #666;">delete_outline</mat-icon>
        </div>
      </div>

      <form [formGroup]="formGroup" class="dialog-body">
        <div *ngIf="!isSomedayTask">
          <input
            matInput
            formControlName="date"
            [matDatepicker]="datepicker"
            [matDatepickerFilter]="checkNotToProvidePreviousWeek"
            class="hidden-datepicker"
            (dateChange)="onCalendarDateChange($event)"
          />
          <mat-datepicker #datepicker></mat-datepicker>
        </div>

        <div class="todo-field">
          <textarea
            matInput
            formControlName="todo"
            #todoTextarea
            placeholder="{{ 'CALENDER.TODO_LABEL' | translate }}"
            class="todo-input"
            [class.todo-done-text]="scheduleData.finished"
            rows="1"
            wrap="soft"
            (input)="adjustTodoHeight()"
          ></textarea>
          <mat-checkbox
            class="todo-checkbox"
            [checked]="scheduleData.finished"
            (change)="toggleFinish($event.checked)"
            aria-label="Mark schedule finished"
          ></mat-checkbox>
        </div>

        <div class="mb-8 color-selector">
          <label class="block text-sm font-medium text-gray-500 mb-3">
            {{ 'CALENDER.ASSIGN_COLOR_LABEL' | translate }}
          </label>
          <div class="flex flex-wrap gap-4">
            <button
              *ngFor="let color of colors; let idx = index"
              [class]="
                'w-6 h-6 rounded-full border border-gray-600 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-black ' + 
                generateColor(idx)
              "
              (click)="setColor(idx)"
            ></button>
          </div>
        </div>

        <div class="dialog-actions flex justify-end gap-3 mt-4">
          <button class="btn-cancel" mat-button mat-dialog-close (click)="onCancel()">
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          <button
            class="btn-save"
            mat-flat-button
            [mat-dialog-close]="onSave()"
            color="primary"
          >
            {{ 'COMMON.SAVE' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./dialoagbox.component.css'],
})
export class DialoagboxComponent implements OnInit, AfterViewInit {
  @ViewChild('datepicker') datepicker!: MatDatepicker<Date>;
  @ViewChild('todoTextarea') todoTextarea!: ElementRef<HTMLTextAreaElement>;
  scheduleData: Schedule;
  colorCode: number = -1;

  colors: Array<string> = [];
  isSomedayTask: boolean = false;

  formGroup: FormGroup = new FormGroup({
    _id: new FormControl(''),
    __v: new FormControl(''),
    todo: new FormControl(''),
    date: new FormControl(''),
    colorCode: new FormControl(''),
    finished: new FormControl(''),
    username: new FormControl(''),
    createdAt: new FormControl(''),
    order: new FormControl(''),
    isSomeday: new FormControl(null),
  });

  constructor(
    private weeklyScheduleService: WeekSchedulerService,
    @Inject(MAT_DIALOG_DATA)
    private dialogData: {
      payload: Schedule;
      reference: MatDialog;
      isSomedayList?: boolean;
    },
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.scheduleData = dialogData.payload;
    this.isSomedayTask = !!dialogData.isSomedayList || !!dialogData.payload.isSomeday;
    this.formGroup.patchValue({ ...this.scheduleData });
  }

  ngOnInit(): void {
    this.colors = [...ColorUtils.COLORS];
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.adjustTodoHeight();
    }, 0);
  }

  openDatepicker() {
    this.datepicker?.open();
  }

  onCalendarDateChange(event: MatDatepickerInputEvent<Date>) {
    const selected = event?.value;
    if (!selected) return;
    const normalized = new Date(selected);
    normalized.setHours(12, 0, 0, 0);
    this.formGroup.patchValue({ date: normalized }, { emitEvent: false });
    this.scheduleData = { ...this.scheduleData, date: normalized };
  }

  adjustTodoHeight() {
    const el = this.todoTextarea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  toggleFinish(state: boolean) {
    this.formGroup.patchValue({ finished: state });
    this.scheduleData = { ...this.scheduleData, finished: state };
    const payload = {
      ...this.formGroup.value,
      colorCode:
        this.colorCode === -1
          ? this.formGroup.get('colorCode')?.value
          : this.colorCode,
    };
    this.weeklyScheduleService.updateSchedule(payload).subscribe(() => {});
  }

  setColor(idx: number) {
    this.colorCode = idx;
    const colorValue = String(idx);
    this.formGroup.patchValue({ colorCode: colorValue });
    this.scheduleData = { ...this.scheduleData, colorCode: colorValue };
  }

  checkNotToProvidePreviousWeek(d: Date | null) {
    const thresoldDate: Date = new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay())
    );
    const date = d || new Date();
    return date >= thresoldDate;
  }

  onSave() {
    return (this.dialogData.payload = {
      ...this.formGroup.value,
      colorCode:
        this.colorCode === -1
          ? this.formGroup.get('colorCode')?.value
          : this.colorCode,
    });
  }

  onCancel() {
    this.dialogData.payload = { ...this.scheduleData };
  }

  onDelete() {
    this.weeklyScheduleService
      .deleteSchedule({ ...this.scheduleData })
      .subscribe((response) => {
        this.dialogData.reference.closeAll();
        
        this.translate.get('CALENDER.SCHEDULE_DELETED').subscribe((message: string) => {
          const snackbarRef: MatSnackBarRef<TextOnlySnackBar> =
            this.snackbar.open(message, this.translate.instant('COMMON.UNDO'), {
              duration: 5000,
              panelClass: ['bg-red-600', 'text-white'],
            });

          snackbarRef.onAction().subscribe(() => {
            this.weeklyScheduleService
              .createSchedule({
                ...this.scheduleData,
                colorCode: String(this.scheduleData.colorCode),
              })
              .subscribe((response) => {
                this.translate.get('CALENDER.SCHEDULE_RESTORED').subscribe((restoredMsg: string) => {
                  this.snackbar.open(restoredMsg, this.translate.instant('COMMON.DONE'), {
                    duration: 3000,
                    panelClass: ['bg-green-600', 'text-white'],
                  });
                });
              });
          });
        });
      });
  }

  generateColor(id: number) {
    return ` ${ColorUtils.COLORS[id]}`;
  }

  selectedColor() {
    return ` ${ColorUtils.COLORS[+this.scheduleData.colorCode]}`;
  }
}
