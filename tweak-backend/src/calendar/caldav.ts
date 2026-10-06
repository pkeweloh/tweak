import { CaldavItem } from './caldav.service';

const NAMESPACES =
  'xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/"';

const PRIVILEGES = [
  'read',
  'write',
  'write-content',
  'write-properties',
  'bind',
  'unbind',
];

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function multistatus(responses: string[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus ${NAMESPACES}>${responses.join(
    '',
  )}</D:multistatus>`;
}

function response(href: string, props: string): string {
  return `<D:response><D:href>${escapeXml(
    href,
  )}</D:href><D:propstat><D:prop>${props}</D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
}

export function notFoundResponse(href: string): string {
  return `<D:response><D:href>${escapeXml(
    href,
  )}</D:href><D:status>HTTP/1.1 404 Not Found</D:status></D:response>`;
}

export function collectionResponse(href: string, ctag: string): string {
  const privileges = PRIVILEGES.map(
    (privilege) => `<D:privilege><D:${privilege}/></D:privilege>`,
  ).join('');
  return response(
    href,
    '<D:resourcetype><D:collection/><C:calendar/></D:resourcetype>' +
      '<D:displayname>Tweak</D:displayname>' +
      '<C:supported-calendar-component-set><C:comp name="VTODO"/></C:supported-calendar-component-set>' +
      `<CS:getctag>${ctag}</CS:getctag>` +
      `<D:current-user-privilege-set>${privileges}</D:current-user-privilege-set>` +
      '<D:supported-report-set>' +
      '<D:supported-report><D:report><C:calendar-multiget/></D:report></D:supported-report>' +
      '<D:supported-report><D:report><C:calendar-query/></D:report></D:supported-report>' +
      '</D:supported-report-set>',
  );
}

export function itemResponse(
  collection: string,
  item: CaldavItem,
  withData: boolean,
): string {
  return response(
    collection + encodeURIComponent(item.href),
    '<D:resourcetype/>' +
      `<D:getetag>${escapeXml(item.etag)}</D:getetag>` +
      '<D:getcontenttype>text/calendar; charset=utf-8; component=VTODO</D:getcontenttype>' +
      (withData
        ? `<C:calendar-data>${escapeXml(item.body)}</C:calendar-data>`
        : ''),
  );
}

export function requestedHrefs(body: string): string[] {
  const hrefs: string[] = [];
  const pattern = /<(?:[\w-]+:)?href[^>]*>([^<]*)<\//g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    const href = match[1]
      .trim()
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    hrefs.push(href);
  }
  return hrefs;
}

export function hrefFile(href: string): string {
  const segment = href.replace(/\/+$/, '').split('/').pop() || '';
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
