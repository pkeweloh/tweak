import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule, ScheduleDocument } from './schema/schedule.schema';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
  ) { }

  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<{ data: string } | Error> {
    try {
      const dateStr = new Date(createScheduleDto.date).toDateString();
      const existingSchedules = await this.scheduleModel.find({
        username: createScheduleDto.username,
        date: dateStr,
      });

      const order = existingSchedules.length;

      const scheduleDoc = new this.scheduleModel({
        ...createScheduleDto,
        order,
      });
      await scheduleDoc.save();
      return { data: 'schedule created!' };
    } catch (error) {
      return error;
    }
  }

  async findAll(user: User) {
    const schedules = await this.scheduleModel
      .find({ username: user.username })
      .sort([
        ['date', 'desc'],
        ['createdAt', 'desc'],
      ])
      .exec();

    return { data: await this.generateScheduleRecordByDates(schedules) };
  }

  async findByWeek(user: User, from: Date, to: Date) {
    const mfrom = new Date(from).toDateString();
    const mto = new Date(to).toDateString();

    const schedules = await this.scheduleModel
      .where({
        username: user.username,
        date: { $gte: mfrom, $lte: mto },
      })
      .sort([['date', 'desc'], ['order', 'asc']]);

    return { data: await this.generateScheduleRecordByDates(schedules) };
  }

  async findOne(id: string) {
    return { data: await this.scheduleModel.findById(id) };
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    await this.scheduleModel.findOneAndUpdate({ _id: id }, updateScheduleDto);
    return { data: `schedule ${id} has been updated` };
  }

  async updateDateById(id: string, newDate: Date, order?: number) {
    const movedSchedule = await this.scheduleModel.findById(id);
    if (!movedSchedule) {
      throw new Error('Schedule not found');
    }

    const dateStr = new Date(newDate).toDateString();

    const siblings = await this.scheduleModel
      .find({
        username: movedSchedule.username,
        date: dateStr,
        _id: { $ne: id },
      })
      .sort({ order: 1 });

    let targetIndex = order !== undefined ? order : siblings.length;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > siblings.length) targetIndex = siblings.length;

    siblings.splice(targetIndex, 0, movedSchedule);

    const bulkOps = siblings.map((schedule, index) => ({
      updateOne: {
        filter: { _id: schedule._id },
        update: { $set: { date: dateStr, order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.scheduleModel.bulkWrite(bulkOps);
    }

    return {
      data: `schedule ${id} has been updated to ${dateStr} at order ${targetIndex}`,
    };
  }

  async remove(id: string) {
    await this.scheduleModel.findByIdAndRemove(id);
    return { data: `schedule ${id} has been removed!` };
  }

  async rollover(user: User) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.scheduleModel.updateMany(
      {
        username: user.username,
        finished: false,
        date: { $lt: today },
      },
      {
        $set: { date: today },
      },
    );

    return {
      data: `Rollover complete. Moved ${result.modifiedCount} tasks to today.`,
      count: result.modifiedCount,
    };
  }

  // PRIVATE METHODS

  private async generateScheduleRecordByDates(
    schedules: (import('mongoose').Document<unknown, any, ScheduleDocument> &
      User &
      Document & { _id: import('mongoose').Types.ObjectId })[],
  ) {
    /**
     * create a HashMap
     *  data: [
     *   {
     *     date: "2022-02-23",
     *     schedules: [
     *       {...},
     *       {...},
     *       {...},
     *     ]
     *   }
     * ]
     */
    const data: Record<string, Array<Schedule>> = {};
    schedules.forEach((schedule: any) => {
      const date = schedule.date.toDateString();
      if (date in data) {
        data[date].push(schedule);
      } else {
        data[date] = [schedule];
      }
    });

    let payload = [];
    Object.keys(data).forEach((key: string) => {
      payload.push({ date: key, schedules: [...data[key]] });
    });

    return payload;
  }
}
