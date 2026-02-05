import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
          class="outline-none border-none h-full px-3 text-sm font-medium w-full bg-transparent text-gray-800"
          placeholder=""
        />
      </div>
    </form>
  `,
  styles: [`
    .input-wrapper:focus-within::before {
      content: "";
      position: absolute;
      top: -2px;
      right: -8px;
      left: -8px;
      bottom: -2px;
      border-radius: 4px;
      box-shadow: 0 1px 4px 1px #0000001c;
      background-color: var(--input-active--background);
      pointer-events: none;
    }
  `],
})
export class AddFormComponent implements OnInit {
  @Input() date!: Date;
  constructor(private readonly weeklyScheduleService: WeekSchedulerService, private snackbar: MatSnackBar) { }

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
      date: this.date,
      colorCode: '0',
      finished: false,
    };

    this.weeklyScheduleService
      .createSchedule(formData)
      .subscribe({
        next: (response) => {
          this.snackbar.open(`New schedule has been created!`, 'Cancel', { duration: 3000 });
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
