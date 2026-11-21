/**
 * Calendar exports for club events: .ics files (Apple Calendar, Outlook and most phone apps)
 * and Google Calendar links. Event times are written in India time ("6:30 PM - 9:00 PM"); an event
 * without a time becomes an all-day event, and one with only a start time ("11:00 AM onwards")
 * is given two hours.
 */

const TZ = 'Asia/Kolkata';

/** "6:30 PM" -> "18:30", or null when there is no time. */
export function to24(t) {
  const m = String(t ?? '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

const compact = (iso) => iso.replace(/-/g, '');
function nextDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
function plusHours(hhmm, n) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(Math.min(23, h + n)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Start and end as calendar stamps, or all-day dates when the event has no time. */
function span(event) {
  const [start, end] = String(event.time ?? '').split(/\s*-\s*/).map(to24);
  const last = event.endDate ?? event.date;
  if (!start) return { allDay: true, from: compact(event.date), to: compact(nextDay(last)) };
  const stop = end ?? plusHours(start, 2);
  return { allDay: false, from: `${compact(event.date)}T${start.replace(':', '')}00`, to: `${compact(last)}T${stop.replace(':', '')}00` };
}

const escapeText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

function vevent(event, stamp) {
  const t = span(event);
  return [
    'BEGIN:VEVENT',
    `UID:${event.slug}@rotaractkhopoli`,
    `DTSTAMP:${stamp}`,
    t.allDay ? `DTSTART;VALUE=DATE:${t.from}` : `DTSTART;TZID=${TZ}:${t.from}`,
    t.allDay ? `DTEND;VALUE=DATE:${t.to}` : `DTEND;TZID=${TZ}:${t.to}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.venue && `LOCATION:${escapeText(event.venue)}`,
    event.summary && `DESCRIPTION:${escapeText(event.summary)}`,
    'END:VEVENT',
  ].filter(Boolean);
}

/** Downloads one or more events as a single .ics file. */
export function downloadIcs(events, filename) {
  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rotaract Club of Khopoli//Club calendar//EN', 'CALSCALE:GREGORIAN',
    events.length > 1 && 'X-WR-CALNAME:Rotaract Club of Khopoli',
    ...events.flatMap((e) => vevent(e, stamp)),
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A link that opens Google Calendar with the event filled in. */
export function googleCalendarUrl(event) {
  const t = span(event);
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${t.from}/${t.to}`, ctz: TZ });
  if (event.venue) params.set('location', event.venue);
  if (event.summary) params.set('details', event.summary);
  return `https://calendar.google.com/calendar/render?${params}`;
}
