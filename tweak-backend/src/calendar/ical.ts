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
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate(),
  )}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)}T${pad(date.getUTCHours())}${pad(
    date.getUTCMinutes(),
  )}${pad(date.getUTCSeconds())}Z`;
}

function summaryLine(task: FeedTask): string {
  return `SUMMARY:${escapeText(task.todo)}`;
}

function dueLine(task: FeedTask): string {
  return `DUE;VALUE=DATE:${formatDate(task.date)}`;
}

function statusLines(task: FeedTask): string[] {
  return task.finished
    ? ['STATUS:COMPLETED', 'PERCENT-COMPLETE:100']
    : ['STATUS:NEEDS-ACTION'];
}

function descriptionLines(task: FeedTask): string[] {
  const notes = task.notes ? htmlToText(task.notes) : '';
  if (!notes) {
    return [];
  }
  const altrep = `data:text/html,${encodeURIComponent(task.notes!)}`;
  return [`DESCRIPTION;ALTREP="${altrep}":${escapeText(notes)}`];
}

function categoryLines(task: FeedTask): string[] {
  const color = COLOR_NAMES[task.colorCode ?? 0];
  return color ? [`CATEGORIES:${color}`] : [];
}

function buildTodo(task: FeedTask, stamp: string): string[] {
  const lines = ['BEGIN:VTODO', `UID:${task.id}@tweak`, `DTSTAMP:${stamp}`];
  if (task.createdAt) {
    lines.push(`CREATED:${formatDateTime(task.createdAt)}`);
  }
  lines.push(
    summaryLine(task),
    dueLine(task),
    ...statusLines(task),
    ...descriptionLines(task),
    ...categoryLines(task),
    'END:VTODO',
  );
  return lines;
}

function serialize(lines: string[]): string {
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function buildTodoCalendar(tasks: FeedTask[], now = new Date()): string {
  const stamp = formatDateTime(now);
  return serialize([
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
  ]);
}

export function buildTodoResource(task: FeedTask): string {
  const stamp = formatDateTime(task.createdAt ?? task.date);
  return serialize([
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tweak//CalDAV//EN',
    ...buildTodo(task, stamp),
    'END:VCALENDAR',
  ]);
}

export type IcalProperty = {
  name: string;
  params: Record<string, string>;
  value: string;
};

export type ParsedTodo = {
  summary: string;
  description: string;
  html?: string;
  date?: string;
  completed: boolean;
  categories: string[];
};

export function unfoldLines(text: string): string[] {
  return text
    .replace(/\r?\n[ \t]/g, '')
    .split(/\r?\n/)
    .filter((line) => line.length);
}

function splitOutsideQuotes(text: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of text) {
    if (char === '"') {
      quoted = !quoted;
    }
    if (char === separator && !quoted) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

export function parseProperty(line: string): IcalProperty {
  let quoted = false;
  let colon = line.length;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      quoted = !quoted;
    } else if (line[i] === ':' && !quoted) {
      colon = i;
      break;
    }
  }
  const [name, ...rawParams] = splitOutsideQuotes(line.slice(0, colon), ';');
  const params: Record<string, string> = {};
  for (const param of rawParams) {
    const eq = param.indexOf('=');
    if (eq > 0) {
      params[param.slice(0, eq).toUpperCase()] = param
        .slice(eq + 1)
        .replace(/^"(.*)"$/, '$1');
    }
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

export function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, char) =>
    char === 'n' || char === 'N' ? '\n' : char,
  );
}

function decodeHtmlDataUri(uri: string): string | undefined {
  const match = /^data:text\/html([^,]*),([\s\S]*)$/i.exec(uri);
  if (!match) {
    return undefined;
  }
  try {
    const html = /;base64/i.test(match[1])
      ? Buffer.from(match[2], 'base64').toString('utf8')
      : decodeURIComponent(match[2]);
    const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    return (body ? body[1] : html).trim();
  } catch {
    return undefined;
  }
}

function icalDate(value: string): string | undefined {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

type TodoProperty = { index: number; property: IcalProperty };

function todoProperties(lines: string[]): TodoProperty[] {
  const result: TodoProperty[] = [];
  let depth = 0;
  let inTodo = false;
  lines.forEach((line, index) => {
    const property = parseProperty(line);
    if (property.name === 'BEGIN') {
      if (inTodo) {
        depth++;
      } else if (property.value.toUpperCase() === 'VTODO') {
        inTodo = true;
      }
    } else if (property.name === 'END' && inTodo) {
      if (depth) {
        depth--;
      } else {
        inTodo = false;
      }
    } else if (inTodo && !depth) {
      result.push({ index, property });
    }
  });
  return result;
}

export function parseTodo(text: string): ParsedTodo | null {
  const lines = unfoldLines(text);
  if (!lines.some((line) => /^BEGIN:VTODO$/i.test(line))) {
    return null;
  }
  const todo: ParsedTodo = {
    summary: '',
    description: '',
    completed: false,
    categories: [],
  };
  let start: string | undefined;
  for (const { property } of todoProperties(lines)) {
    switch (property.name) {
      case 'SUMMARY':
        todo.summary = unescapeText(property.value).trim();
        break;
      case 'DESCRIPTION':
        todo.description = unescapeText(property.value).trim();
        if (property.params.ALTREP) {
          todo.html = decodeHtmlDataUri(property.params.ALTREP);
        }
        break;
      case 'DUE':
        todo.date = icalDate(property.value);
        break;
      case 'DTSTART':
        start = icalDate(property.value);
        break;
      case 'STATUS':
        todo.completed = property.value.toUpperCase() === 'COMPLETED';
        break;
      case 'CATEGORIES':
        todo.categories.push(
          ...splitOutsideQuotes(property.value, ',').map((category) =>
            unescapeText(category).trim(),
          ),
        );
        break;
    }
  }
  todo.date = todo.date ?? start;
  return todo;
}

export function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .join('<br>');
}

export function notesFromTodo(todo: ParsedTodo): string {
  return todo.html ?? (todo.description ? textToHtml(todo.description) : '');
}

export function colorCodeFromCategories(
  categories: string[],
): number | undefined {
  const index = COLOR_NAMES.findIndex(
    (name) =>
      name &&
      categories.some(
        (category) => category.toLowerCase() === name.toLowerCase(),
      ),
  );
  return index > 0 ? index : undefined;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function patchTodoResource(stored: string, task: FeedTask): string {
  const todo = parseTodo(stored);
  if (!todo) {
    return buildTodoResource(task);
  }
  const lines = unfoldLines(stored);
  const props = todoProperties(lines);
  const replace = new Map<number, string[]>();
  const append: string[] = [];
  const sync = (names: string[], keep: boolean, fresh: string[]) => {
    if (keep) {
      return;
    }
    const found = props.filter(({ property }) => names.includes(property.name));
    found.forEach(({ index }, i) => replace.set(index, i ? [] : fresh));
    if (!found.length) {
      append.push(...fresh);
    }
  };

  sync(['SUMMARY'], todo.summary === task.todo, [summaryLine(task)]);
  const sameDate = todo.date === isoDate(task.date);
  sync(['DUE'], sameDate, [dueLine(task)]);
  sync(['DTSTART', 'DURATION'], sameDate, []);
  const sameStatus = todo.completed === task.finished;
  const [status, ...progress] = statusLines(task);
  sync(['STATUS'], sameStatus, [status]);
  sync(['PERCENT-COMPLETE', 'COMPLETED'], sameStatus, progress);
  sync(
    ['DESCRIPTION'],
    notesFromTodo(todo) === (task.notes || ''),
    descriptionLines(task),
  );
  const color = COLOR_NAMES[task.colorCode ?? 0] ? task.colorCode : undefined;
  sync(
    ['CATEGORIES'],
    colorCodeFromCategories(todo.categories) === color,
    categoryLines(task),
  );

  const result: string[] = [];
  lines.forEach((line, index) => {
    if (/^END:VTODO$/i.test(line)) {
      result.push(...append.splice(0));
    }
    result.push(...(replace.get(index) ?? [line]));
  });
  return serialize(result);
}
