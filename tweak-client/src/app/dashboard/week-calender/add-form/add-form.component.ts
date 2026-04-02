import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';
import { Schedule } from 'src/app/shared/utils/types.utils';

@Component({
  selector: 'app-add-form',
  template: `
    <form
      [formGroup]="addForm"
      (ngSubmit)="onSubmit()"
      class="flex flex-col w-full h-full"
    >
      <div class="relative w-full h-full input-wrapper">
        <input
          formControlName="todo"
          name="todo"
          autocomplete="false"
          aria-autocomplete="none"
          type="text"
          (blur)="onSubmit()"
          class="outline-none border-none h-full text-sm font-medium w-full bg-transparent text-black-800 relative z-10"
          placeholder=""
        />
      </div>
    </form>
  `,
  styleUrls: ['./add-form.component.css'],
})
export class AddFormComponent implements OnInit {
  @Input() date!: Date;
  @Input() isSomeday?: number | null;
  constructor(
    private readonly weeklyScheduleService: WeekSchedulerService,
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) { }

  isSubmitting = false;

  addForm: FormGroup = new FormGroup({
    todo: new FormControl(null),
  });

  onSubmit() {
    if (this.isSubmitting) return;

    const todo = this.addForm.get('todo')?.value;
    if (!todo || todo.trim() === '') {
      return;
    }

    this.isSubmitting = true;
    const taskText = todo.trim();
    this.addForm.reset();

    const formData: Partial<Schedule> = {
      todo: taskText,
      date: this.date || new Date(),
      isSomeday: this.isSomeday,
      colorCode: '0',
      finished: false,
      notes: '',
    };

    this.weeklyScheduleService
      .createSchedule(formData)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Failed to create schedule', err);
          this.isSubmitting = false;
        }
      });
  }

  ngOnInit(): void { }
}
