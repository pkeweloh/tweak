import { Controller, Get, Header, Param } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get(':token/tweak.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @Header('Content-Disposition', 'inline; filename="tweak.ics"')
  feed(@Param('token') token: string) {
    return this.calendarService.buildFeed(token);
  }
}
