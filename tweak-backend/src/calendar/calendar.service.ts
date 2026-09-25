import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DEFAULT_USER_SETTINGS,
  User,
  UserDocument,
} from 'src/auth/schema/user.schema';
import {
  Schedule,
  ScheduleDocument,
} from 'src/schedule/schema/schedule.schema';
import { buildTodoCalendar, FeedTask } from './ical';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async buildFeed(token: string): Promise<string> {
    if (!/^[0-9a-f]{64}$/.test(token)) {
      throw new NotFoundException();
    }
    const user = await this.userModel.findOne({ calendarToken: token });
    if (!user) {
      throw new NotFoundException();
    }

    const days = user.calendarFeedDays || DEFAULT_USER_SETTINGS.calendarFeedDays;
    const cutoff = new Date();
    cutoff.setUTCHours(0, 0, 0, 0);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);

    const schedules: any[] = await this.scheduleModel
      .find({
        username: user.username,
        isSomeday: null,
        $or: [{ finished: false }, { date: { $gte: cutoff } }],
      })
      .sort({ date: 1, order: 1 })
      .lean();

    const tasks: FeedTask[] = schedules.map((schedule) => ({
      id: String(schedule._id),
      todo: schedule.todo,
      notes: schedule.notes,
      date: new Date(schedule.date),
      finished: !!schedule.finished,
      colorCode: schedule.colorCode,
      createdAt: schedule.createdAt ? new Date(schedule.createdAt) : undefined,
    }));

    return buildTodoCalendar(tasks);
  }
}
