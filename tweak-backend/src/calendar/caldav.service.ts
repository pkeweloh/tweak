import {
  BadRequestException,
  Injectable,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';
import {
  Schedule,
  ScheduleDocument,
} from 'src/schedule/schema/schedule.schema';
import { CalendarService, toFeedTask } from './calendar.service';
import {
  buildTodoResource,
  colorCodeFromCategories,
  isoDate,
  notesFromTodo,
  parseTodo,
  patchTodoResource,
} from './ical';

export type CaldavItem = {
  href: string;
  etag: string;
  body: string;
};

@Injectable()
export class CaldavService {
  constructor(
    private readonly calendarService: CalendarService,
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  findUser(token: string): Promise<User> {
    return this.calendarService.findUser(token);
  }

  async listItems(user: User): Promise<CaldavItem[]> {
    const schedules = await this.calendarService.findFeedSchedules(user);
    return schedules.map((schedule) => this.toItem(schedule));
  }

  ctag(items: CaldavItem[]): string {
    return this.hash(items.map((item) => item.href + item.etag).join('|'));
  }

  async getItem(user: User, href: string): Promise<CaldavItem | null> {
    const schedule = await this.findSchedule(user, href);
    return schedule ? this.toItem(schedule) : null;
  }

  async putItem(
    user: User,
    href: string,
    body: string,
    ifMatch?: string,
    ifNoneMatch?: string,
  ): Promise<{ created: boolean }> {
    const todo = parseTodo(body);
    if (!todo) {
      throw new BadRequestException('A VTODO component is required');
    }
    const existing = await this.findSchedule(user, href);
    if (ifNoneMatch === '*' && existing) {
      throw new PreconditionFailedException();
    }
    if (ifMatch && (!existing || this.toItem(existing).etag !== ifMatch)) {
      throw new PreconditionFailedException();
    }

    const colorCode = colorCodeFromCategories(todo.categories);
    if (existing) {
      const update: Record<string, unknown> = {
        finished: todo.completed,
        ical: body,
      };
      if (todo.summary) {
        update.todo = todo.summary;
      }
      const served = parseTodo(this.toItem(existing).body)!;
      const notesChanged =
        todo.html !== undefined
          ? todo.html !== served.html
          : todo.description !== served.description;
      if (notesChanged) {
        update.notes = notesFromTodo(todo);
      }
      if (colorCode) {
        update.colorCode = colorCode;
      }
      if (todo.date && todo.date !== isoDate(new Date(existing.date))) {
        update.date = new Date(todo.date);
        update.order = await this.countOn(user, update.date as Date);
      }
      await this.scheduleModel.updateOne({ _id: existing._id }, update, {
        runValidators: true,
      });
      return { created: false };
    }

    const date = new Date(todo.date ?? isoDate(new Date()));
    await this.scheduleModel.create({
      username: user.username,
      todo: todo.summary || 'Untitled',
      notes: notesFromTodo(todo),
      date,
      finished: todo.completed,
      ...(colorCode && { colorCode }),
      order: await this.countOn(user, date),
      isSomeday: null,
      ical: body,
      icalHref: href,
    });
    return { created: true };
  }

  async deleteItem(
    user: User,
    href: string,
    ifMatch?: string,
  ): Promise<boolean> {
    const existing = await this.findSchedule(user, href);
    if (!existing) {
      return false;
    }
    if (ifMatch && this.toItem(existing).etag !== ifMatch) {
      throw new PreconditionFailedException();
    }
    await this.scheduleModel.deleteOne({ _id: existing._id });
    return true;
  }

  private async findSchedule(user: User, href: string): Promise<any | null> {
    const id = href.replace(/\.ics$/, '');
    if (isValidObjectId(id) && href === `${id}.ics`) {
      const schedule = await this.scheduleModel
        .findOne({ _id: id, username: user.username, icalHref: null })
        .lean();
      if (schedule) {
        return schedule;
      }
    }
    return this.scheduleModel
      .findOne({ username: user.username, icalHref: href })
      .lean();
  }

  private countOn(user: User, date: Date): Promise<number> {
    return this.scheduleModel
      .countDocuments({ username: user.username, date, isSomeday: null })
      .exec();
  }

  private toItem(schedule: any): CaldavItem {
    const task = toFeedTask(schedule);
    const body = schedule.ical
      ? patchTodoResource(schedule.ical, task)
      : buildTodoResource(task);
    return {
      href: schedule.icalHref || `${schedule._id}.ics`,
      etag: `"${this.hash(body)}"`,
      body,
    };
  }

  private hash(value: string): string {
    return createHash('sha1').update(value).digest('hex');
  }
}
