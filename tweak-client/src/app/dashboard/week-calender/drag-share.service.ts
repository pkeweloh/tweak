import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Injectable, OnInit } from '@angular/core';
import { WeekSchedulerService } from 'src/app/shared/services/week-scheduler.service';

@Injectable({
  providedIn: 'root',
})
export class DragSropShareService implements OnInit {
  constructor(
    private weekScheduleService: WeekSchedulerService
  ) { }
  ngOnInit(): void { }

  public drop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const scheduleId: string = event.item.data?._id;
    const dateTobePushed: Date = new Date(event.container.id.split('@')[1]);

    // Optimistic Update: Move the item visually immediately
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const newOrder = event.currentIndex;

    const targetList: any[] = event.container.data || [];
    targetList.forEach((item, index) => {
      item.order = index;
      if (item._id === scheduleId) {
        item.date = dateTobePushed;
      }
    });

    this.weekScheduleService
      .updateScheduleDatebyId(scheduleId, dateTobePushed, newOrder)
      .subscribe(() => { });
  }
}
