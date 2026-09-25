import {
  buildTodoCalendar,
  escapeText,
  foldLine,
  formatDate,
  htmlToText,
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
    expect(htmlToText('20:00h en Twitch.\nMusic')).toBe('20:00h en Twitch.\nMusic');
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
    expect(lines).toContain('DESCRIPTION:Two liters');
    expect(lines).toContain('CATEGORIES:Red');
    expect(lines).toContain('UID:b2@tweak');
    expect(lines).toContain('STATUS:COMPLETED');
    expect(lines).toContain('PERCENT-COMPLETE:100');
    expect(lines.filter((line) => line.startsWith('CATEGORIES:'))).toHaveLength(1);
    expect(lines[lines.length - 2]).toBe('END:VCALENDAR');
  });
});
