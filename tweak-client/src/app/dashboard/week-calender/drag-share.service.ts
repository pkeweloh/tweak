import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';

@Injectable({
  providedIn: 'root',
})
export class DragSropShareService implements OnInit {
  constructor(
    private weekScheduleService: WeekSchedulerService,
    private snackBar: MatSnackBar
  ) { }
  ngOnInit(): void { }

  public drop(event: CdkDragDrop<any>) {
    const scheduleId: string = event.item.data?._id || event.previousContainer.id.split('@')[1];
    const dateTobePushed: Date = new Date(event.container.id.split('@')[1]);

    this.weekScheduleService
      .updateScheduleDatebyId(scheduleId, dateTobePushed)
      .subscribe((response) => {
        this.snackBar.open(
          `Schedule has been updated to ${dateTobePushed.toDateString()}`,
          'Done',
          { duration: 3000, panelClass: ['bg-[#5167F4]', 'text-white'] }
        );
      });
  }
}
