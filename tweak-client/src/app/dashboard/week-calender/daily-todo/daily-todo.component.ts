import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { ColorUtils } from 'src/app/shared/utils/colors.utils';
import { Schedule } from 'src/app/shared/utils/types.utils';
import { DragSropShareService } from '../drag-share.service';
import { DialoagboxComponent } from './dialoagbox/dialoagbox.component';

@Component({
  selector: 'app-daily-todo',
  template: `
    <div class="flex flex-col">
      <div
        cdkDropList
        [cdkDropListData]="works"
        [cdkDropListConnectedTo]="generatedIds"
        [id]="getUniqueIdFromDate()"
        (cdkDropListDropped)="onDropped($event)"
        class="min-h-0"
      >
        <div
          *ngFor="let slot of slots; let idx = index"
          class="flex-col w-full flex justify-start border-b h-[45px]"
          [ngClass]="{
            'hover:border-[#5167F466]': works[idx] || idx === works.length,
            'cursor-pointer': works[idx],
            'cursor-text': idx === works.length
          }"
        >
          <div
            *ngIf="works[idx] as work"
            cdkDrag
            [cdkDragData]="work"
            class="schedule-div h-full flex items-center px-1 cursor-pointer"
            fxLayout="row"
            fxLayoutAlign="space-between center"
            (click)="launchDialog($event, editForms[idx])"
          >
            <div class="flex-1 truncate">
              <div
                class="outline-none cursor-grab border-none rounded-xl truncate inline px-1.5 w-full focus:bg-gray-50 focus:z-50"
[ngClass]="getColor(work.colorCode)"
  [class.opacity-30]="work.finished"
  [class.line-through]="work.finished"
              >
                {{ work.todo }}
              </div>
            </div>
            <div class="display-on-parent-hover hidden ml-2">
              <mat-checkbox
                (click)="$event.stopPropagation()"
                (change)="onCheck($event.checked, editForms[idx])"
                [checked]="work.finished"
              ></mat-checkbox>
            </div>
          </div>

          <!-- Empty Slot Placeholder / Add Form -->
          <div
            *ngIf="!works[idx]"
            class="h-full w-full flex items-center text-gray-300 italic text-sm"
          >
            <app-add-form
              *ngIf="idx === works.length"
              [date]="date"
              class="w-full h-full"
            ></app-add-form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .schedule-div:hover .display-on-parent-hover {
        visibility: visible;
        display: block;
      }
      .bg-green-420 {
        background-color: #22ffa1;
      }
      .bg-yellow-420 {
        background-color: #fdef5d;
      }
      .bg-blue-420 {
        background-color: #a3b1ff;
      }
    `,
  ],
})
export class DailyTodoComponent implements OnInit, OnDestroy {
  @Input() date!: Date;
  @Input() generatedIds!: Array<string>;
  @Input() connectedIndex!: number;
  @Input() maxRows: number = 10;

  works: Array<Schedule> = [];
  slots: Array<number> = [];
  editForms: Array<FormGroup> = [];
  bgColor: string = 'bg-transparent';

  constructor(
    private readonly weeklyScheduleService: WeekSchedulerService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private dragDropService: DragSropShareService
  ) { }

  getUniqueId(work: Schedule) {
    return `ID@${work._id}@${work.date}`;
  }

  ngOnInit(): void {
    this.weeklyScheduleService.weekSchedules$.subscribe((data) => {
      const d = data[this.date.toDateString()];
      this.works = d ? [...d] : [];

      this.editForms = [];
      this.works.forEach((work) =>
        this.editForms.push(this.createNewForm({ ...work }))
      );

      this.generateSlots();
    });
  }

  ngOnChanges(): void {
    this.generateSlots();
  }

  private generateSlots() {
    this.slots = Array(this.maxRows)
      .fill(0)
      .map((x, i) => i);
  }

  ngOnDestroy(): void { }

  private createNewForm(work: Schedule): FormGroup {
    const editForm: FormGroup = new FormGroup({
      _id: new FormControl('', [Validators.requiredTrue]),
      __v: new FormControl('', [Validators.requiredTrue]),
      todo: new FormControl('', [Validators.requiredTrue]),
      date: new FormControl('', [Validators.requiredTrue]),
      colorCode: new FormControl('', [Validators.requiredTrue]),
      finished: new FormControl('', [Validators.requiredTrue]),
      username: new FormControl('', [Validators.requiredTrue]),
      createdAt: new FormControl('', [Validators.requiredTrue]),
    });

    editForm.setValue({ ...work });
    return editForm;
  }

  onEdited(form: FormGroup) {
    this.weeklyScheduleService.updateSchedule({ ...form.value }).subscribe(() => {
      this.snackbar.open(`Schedule has been updated`, 'Done', {
        duration: 3000,
        panelClass: ['bg-[#5167F4]', 'text-white'],
      });
    });
  }

  launchDialog(_: MouseEvent, form: FormGroup) {
    const previousState = { ...form.value };
    const dialogRef = this.dialog.open(DialoagboxComponent, {
      width: '600px',
      data: { payload: form.value, reference: this.dialog },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      form.setValue({ ...result });
      if (JSON.stringify(previousState) === JSON.stringify({ ...form.value }))
        return;
      this.onEdited(form);
    });
  }

  getColor(colorCode: string) {
    return ColorUtils.COLORS[+colorCode];
  }

  onCheck(state: boolean, form: FormGroup) {
    form.setValue({ ...form.value, finished: state });
    this.onEdited(form);
  }

  onDropped(event: CdkDragDrop<Array<Schedule>>) {
    this.dragDropService.drop(event);
  }

  getUniqueIdFromDate() {
    return `ID@${this.date.toDateString()}`;
  }
}
