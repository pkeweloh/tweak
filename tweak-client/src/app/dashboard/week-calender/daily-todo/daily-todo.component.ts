import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { ColorUtils } from 'src/app/shared/utils/colors.utils';
import { Schedule } from 'src/app/shared/utils/types.utils';
import { DragSropShareService } from '../drag-share.service';
import { DialoagboxComponent } from './dialoagbox/dialoagbox.component';

@Component({
  selector: 'app-daily-todo',
  template: `
    <div class="flex flex-col h-full">
      <div
        cdkDropList
        [cdkDropListData]="works"
        [cdkDropListConnectedTo]="generatedIds"
        [id]="getUniqueIdFromDate()"
        (cdkDropListDropped)="onDropped($event)"
        class="drop-list-container flex-grow relative"
        [style.--min-rows]="maxRows"
      >
        <div
          *ngFor="let work of works; let idx = index; trackBy: trackById"
          cdkDrag
          [cdkDragData]="work"
          class="schedule-div w-full flex items-center px-1 cursor-grab active:cursor-grabbing relative h-[45px] hover:border-[#5167F4] border-b border-transparent transition-colors duration-100 pr-7"
          [class.opacity-0]="draggedIndex === idx"
          (cdkDragStarted)="onDragStart(idx)"
          (cdkDragEnded)="onDragEnd()"
          (click)="launchDialog($event, editForms[idx])"
        >
          <ng-template cdkDragPreview [matchSize]="true">
            <div class="drag-preview-content flex items-center">
              <div class="flex-1 min-w-0 flex items-center">
                <div
                  class="outline-none border-none rounded-xl truncate inline-block px-1.5 max-w-full"
                  [ngClass]="getColor(work.colorCode)"
                  [class.opacity-30]="work.finished"
                  [class.line-through]="work.finished"
                >
                  {{ work.todo }}
                </div>
              </div>
            </div>
          </ng-template>

          <div *cdkDragPlaceholder class="drag-placeholder"></div>

          <div class="flex-1 min-w-0 flex items-center">
            <div
              class="outline-none border-none rounded-xl truncate inline-block px-1.5 max-w-full focus:bg-gray-50 focus:z-50"
              [ngClass]="getColor(work.colorCode)"
              [class.opacity-30]="work.finished"
              [class.line-through]="work.finished"
            >
              {{ work.todo }}
            </div>
          </div>
          
          <div class="display-on-parent-hover hidden absolute right-1 top-1/2 -translate-y-1/2">
            <mat-checkbox
              (click)="$event.stopPropagation()"
              (change)="onCheck($event.checked, editForms[idx])"
              [checked]="work.finished"
            ></mat-checkbox>
          </div>
        </div>

        <div class="h-[45px] max-h-[45px] overflow-hidden w-full flex items-center text-gray-300 italic text-sm px-1 hover:border-[#5167F4] border-b border-transparent">
          <app-add-form
            [date]="date"
            class="w-full h-full"
          ></app-add-form>
        </div>
      </div>
    </div>
  `,
  styleUrls: [],
})
export class DailyTodoComponent implements OnInit, OnDestroy {
  @Input() date!: Date;
  @Input() generatedIds!: Array<string>;
  @Input() connectedIndex!: number;
  @Input() maxRows: number = 10;

  works: Array<Schedule> = [];
  editForms: Array<FormGroup> = [];
  draggedIndex: number = -1;
  isDragging: boolean = false;

  constructor(
    private readonly weeklyScheduleService: WeekSchedulerService,
    private dialog: MatDialog,
    private dragDropService: DragSropShareService
  ) { }

  getUniqueId(work: Schedule) {
    return `ID@${work._id}@${work.date}`;
  }

  ngOnInit(): void {
    this.weeklyScheduleService.weekSchedules$.subscribe((data) => {
      const d = data[this.date.toDateString()];
      this.works = d ? [...d].sort((a, b) => this.sortTasks(a, b)) : [];

      this.editForms = [];
      this.works.forEach((work) =>
        this.editForms.push(this.createNewForm({ ...work }))
      );
    });
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
      order: new FormControl('', [Validators.requiredTrue]),
    });

    editForm.setValue({ ...work });
    return editForm;
  }

  onEdited(form: FormGroup) {
    this.weeklyScheduleService.updateSchedule({ ...form.value }).subscribe(() => {
    });
  }

  launchDialog(_: MouseEvent, form: FormGroup) {
    if (this.isDragging) return;

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

  onDragStart(index: number) {
    this.draggedIndex = index;
    this.isDragging = true;
    document.body.style.cursor = 'grabbing';
  }

  onDragEnd() {
    this.draggedIndex = -1;
    document.body.style.cursor = '';
    setTimeout(() => {
      this.isDragging = false;
    }, 50);
  }

  getColor(colorCode: string) {
    return ColorUtils.COLORS[+colorCode];
  }

  onCheck(state: boolean, form: FormGroup) {
    form.setValue({ ...form.value, finished: state });
    const work = this.works.find((w) => w._id === form.value._id);
    if (work) {
      work.finished = state;
      this.works.sort((a, b) => this.sortTasks(a, b));
    }
    this.onEdited(form);
  }

  sortTasks(a: Schedule, b: Schedule): number {
    if (a.finished !== b.finished) {
      return a.finished ? 1 : -1;
    }
    return (a.order || 0) - (b.order || 0);
  }

  onDropped(event: CdkDragDrop<Array<Schedule>>) {
    this.dragDropService.drop(event);
  }

  getUniqueIdFromDate() {
    return `ID@${this.date.toDateString()}`;
  }

  trackById(index: number, item: Schedule) {
    return item._id;
  }
}
