export type FeedTask = {
  id: string;
  todo: string;
  notes?: string;
  date: Date;
  finished: boolean;
  colorCode?: number;
  createdAt?: Date;
};

const COLOR_NAMES = [
  '',
  'Red',
  'Yellow',
  'Black',
  'Gray',
  'Blue',
  'Amber',
  'Green',
  'Fuchsia',
];

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    const limit = parts.length ? 74 : 75;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<\/(td|th)>/gi, ' ')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildTodo(task: FeedTask, stamp: string): string[] {
  const lines = [
    'BEGIN:VTODO',
    `UID:${task.id}@tweak`,
    `DTSTAMP:${stamp}`,
  ];
  if (task.createdAt) {
    lines.push(`CREATED:${formatDateTime(task.createdAt)}`);
  }
  lines.push(`SUMMARY:${escapeText(task.todo)}`);
  lines.push(`DUE;VALUE=DATE:${formatDate(task.date)}`);
  if (task.finished) {
    lines.push('STATUS:COMPLETED', 'PERCENT-COMPLETE:100');
  } else {
    lines.push('STATUS:NEEDS-ACTION');
  }
  const notes = task.notes ? htmlToText(task.notes) : '';
  if (notes) {
    lines.push(`DESCRIPTION:${escapeText(notes)}`);
  }
  const color = COLOR_NAMES[task.colorCode ?? 0];
  if (color) {
    lines.push(`CATEGORIES:${color}`);
  }
  lines.push('END:VTODO');
  return lines;
}

export function buildTodoCalendar(tasks: FeedTask[], now = new Date()): string {
  const stamp = formatDateTime(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tweak//Calendar Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Tweak',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    ...tasks.flatMap((task) => buildTodo(task, stamp)),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
