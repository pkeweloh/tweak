import {
  buildTodoCalendar,
  buildTodoResource,
  escapeText,
  FeedTask,
  foldLine,
  formatDate,
  htmlToText,
  notesFromTodo,
  parseTodo,
  patchTodoResource,
} from './ical';

const unfold = (text: string) => text.replace(/\r\n /g, '');

describe('ical', () => {
  it('escapes special characters', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds lines at 75 octets without splitting multi-byte characters', () => {
    const line = `SUMMARY:${'ñá€'.repeat(40)}`;
    const folded = foldLine(line);
    for (const part of folded.split('\r\n')) {
      expect(Buffer.byteLength(part)).toBeLessThanOrEqual(75);
    }
    expect(unfold(folded)).toBe(line);
  });

  it('leaves short lines untouched', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('converts notes html to plain text', () => {
    const html =
      '<p><a href="https://example.com">https://example.com</a></p><p>Tom &amp; Jerry&nbsp;&#8217;s</p><ul><li>one</li><li>two</li></ul>';
    expect(htmlToText(html)).toBe(
      'https://example.com\nTom & Jerry ’s\n- one\n- two',
    );
  });

  it('keeps plain text notes as they are', () => {
    expect(htmlToText('20:00h en Twitch.\nMusic')).toBe(
      '20:00h en Twitch.\nMusic',
    );
  });

  it('formats dates in UTC', () => {
    expect(formatDate(new Date('2026-10-01T00:00:00.000Z'))).toBe('20261001');
  });

  it('builds a calendar with pending and completed todos', () => {
    const ics = buildTodoCalendar(
      [
        {
          id: 'a1',
          todo: 'Buy milk, bread',
          notes: '<p>Two liters</p>',
          date: new Date('2026-09-25T00:00:00.000Z'),
          finished: false,
          colorCode: 1,
          createdAt: new Date('2026-09-20T10:11:12.000Z'),
        },
        {
          id: 'b2',
          todo: 'Done task',
          date: new Date('2026-09-24T00:00:00.000Z'),
          finished: true,
          colorCode: 0,
        },
      ],
      new Date('2026-09-25T12:00:00.000Z'),
    );
    const lines = unfold(ics).split('\r\n');

    expect(ics.endsWith('\r\n')).toBe(true);
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('X-WR-CALNAME:Tweak');
    expect(lines.filter((line) => line === 'BEGIN:VTODO')).toHaveLength(2);
    expect(lines).toContain('UID:a1@tweak');
    expect(lines).toContain('DTSTAMP:20260925T120000Z');
    expect(lines).toContain('CREATED:20260920T101112Z');
    expect(lines).toContain('SUMMARY:Buy milk\\, bread');
    expect(lines).toContain('DUE;VALUE=DATE:20260925');
    expect(lines).toContain('STATUS:NEEDS-ACTION');
    expect(lines).toContain(
      'DESCRIPTION;ALTREP="data:text/html,%3Cp%3ETwo%20liters%3C%2Fp%3E":Two liters',
    );
    expect(lines).toContain('CATEGORIES:Red');
    expect(lines).toContain('UID:b2@tweak');
    expect(lines).toContain('STATUS:COMPLETED');
    expect(lines).toContain('PERCENT-COMPLETE:100');
    expect(lines.filter((line) => line.startsWith('CATEGORIES:'))).toHaveLength(
      1,
    );
    expect(lines[lines.length - 2]).toBe('END:VCALENDAR');
  });

  describe('caldav resources', () => {
    const task: FeedTask = {
      id: 'a1',
      todo: 'Buy milk',
      notes: '<p>Two <b>liters</b></p>',
      date: new Date('2026-10-08T00:00:00.000Z'),
      finished: false,
      colorCode: 7,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
    };
    const stored = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:Thunderbird',
      'BEGIN:VTODO',
      'UID:abc-123',
      'DTSTAMP:20261006T120000Z',
      'SUMMARY:Buy milk',
      'DTSTART;TZID=Europe/Madrid:20261007T090000',
      'DUE;TZID=Europe/Madrid:20261008T090000',
      'PRIORITY:1',
      'CATEGORIES:Work,Green',
      'DESCRIPTION;ALTREP="data:text/html,%3Cp%3ETwo%20%3Cb%3Eliters%3C%2Fb%3E%3C',
      ' %2Fp%3E":Two liters',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VTODO',
      'END:VCALENDAR',
      '',
    ].join('\r\n');

    it('parses a Thunderbird todo', () => {
      expect(parseTodo(stored)).toEqual({
        summary: 'Buy milk',
        description: 'Two liters',
        html: '<p>Two <b>liters</b></p>',
        date: '2026-10-08',
        completed: false,
        categories: ['Work', 'Green'],
      });
    });

    it('returns null without a VTODO', () => {
      expect(parseTodo('BEGIN:VCALENDAR\r\nEND:VCALENDAR')).toBeNull();
    });

    it('turns plain text descriptions into html notes', () => {
      const todo = parseTodo(
        'BEGIN:VTODO\r\nSUMMARY:x\r\nDESCRIPTION:one\\ntwo <3>\r\nEND:VTODO',
      )!;
      expect(notesFromTodo(todo)).toBe('one<br>two &lt;3&gt;');
    });

    it('builds a standalone resource without METHOD', () => {
      const lines = unfold(buildTodoResource(task)).split('\r\n');
      expect(lines).not.toContain('METHOD:PUBLISH');
      expect(lines).toContain('UID:a1@tweak');
      expect(lines).toContain('DTSTAMP:20261001T100000Z');
    });

    it('keeps the stored resource when nothing changed in Tweak', () => {
      expect(unfold(patchTodoResource(stored, task))).toBe(
        unfold(stored).replace(/\r\n$/, '') + '\r\n',
      );
    });

    it('applies Tweak changes and keeps the rest', () => {
      const patched = unfold(
        patchTodoResource(stored, {
          ...task,
          todo: 'Buy oat milk',
          date: new Date('2026-10-09T00:00:00.000Z'),
          finished: true,
        }),
      ).split('\r\n');
      expect(patched).toContain('SUMMARY:Buy oat milk');
      expect(patched).toContain('DUE;VALUE=DATE:20261009');
      expect(patched.some((line) => line.startsWith('DTSTART'))).toBe(false);
      expect(patched).toContain('STATUS:COMPLETED');
      expect(patched).toContain('PERCENT-COMPLETE:100');
      expect(patched).toContain('PRIORITY:1');
      expect(patched).toContain('CATEGORIES:Work,Green');
      expect(patched).toContain('DESCRIPTION:Reminder');
      expect(patched.indexOf('STATUS:COMPLETED')).toBeLessThan(
        patched.indexOf('END:VTODO'),
      );
    });

    it('replaces the description when the notes changed in Tweak', () => {
      const patched = unfold(
        patchTodoResource(stored, { ...task, notes: '<p>Three</p>' }),
      ).split('\r\n');
      expect(patched).toContain(
        'DESCRIPTION;ALTREP="data:text/html,%3Cp%3EThree%3C%2Fp%3E":Three',
      );
      expect(patched).toContain('DESCRIPTION:Reminder');
    });
  });
});
