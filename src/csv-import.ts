export interface SupportRequest {
  title: string;
  email: string;
  affectedItems: number;
  details: string;
}
export interface ImportIssue { line: number; messages: string[]; }
export interface ImportReport { valid: SupportRequest[]; issues: ImportIssue[]; total: number; }
export const CSV_LIMIT = 200_000;
const HEADERS = ['title', 'email', 'affectedItems', 'details'];

/** Bounded CSV reader. Records retain physical start lines, including quoted newlines. */
export function importRequests(input: string): ImportReport {
  const fail = (message: string, line = 1): ImportReport => ({ valid: [], issues: [{ line, messages: [message] }], total: 0 });
  if (input.length > CSV_LIMIT) return fail('Use a file smaller than 200,000 characters.');
  const source = input.replace(/^\uFEFF/, '');
  if (!source.trim()) return fail('Add a CSV header and at least one data row.');
  let inQuotes = false, commas = 0, semicolons = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') { if (inQuotes && source[i + 1] === '"') i++; else inQuotes = !inQuotes; }
    else if (!inQuotes && /[\r\n]/.test(char)) break;
    else if (!inQuotes && char === ',') commas++;
    else if (!inQuotes && char === ';') semicolons++;
  }
  const separator = semicolons > commas ? ';' : ',';
  const records: { line: number; cells: string[] }[] = [];
  let cells: string[] = [], value = '', quoted = false, closed = false, line = 1, start = 1;
  const field = () => { cells.push(value); value = ''; closed = false; };
  const record = () => {
    field();
    if (cells.some(cell => cell.trim())) records.push({ line: start, cells });
    cells = [];
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { value += '"'; i++; }
        else { quoted = false; closed = true; }
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && source[i + 1] === '\n') i++;
        value += '\n'; line++;
      } else value += char;
    } else if (char === separator) field();
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      record(); line++; start = line;
      if (records.length > 251) return fail('Import at most 250 data rows.');
    } else if (char === '"') {
      if (value.length || closed) return fail('Unexpected quote in an unquoted field.', line);
      quoted = true;
    } else if (closed) {
      if (char !== ' ' && char !== '\t') return fail('Unexpected text after a closing quote.', line);
    } else value += char;
  }
  if (quoted) return fail('A quoted field is not closed.', start);
  record();
  if (records.length > 251) return fail('Import at most 250 data rows.');
  const header = records.shift()?.cells.map(value => value.trim());
  if (!header || header.length !== 4 || new Set(header).size !== 4 || HEADERS.some(key => !header.includes(key))) {
    return fail('Use these four unique headers: title, email, affectedItems, details (any order).');
  }
  if (!records.length) return fail('Add at least one data row below the header.');
  const result: ImportReport = { valid: [], issues: [], total: records.length };
  for (const record of records) {
    if (record.cells.length !== 4) { result.issues.push({ line: record.line, messages: ['Expected exactly four columns.'] }); continue; }
    const data = Object.fromEntries(header.map((key, index) => [key, record.cells[index].trim()]));
    const messages: string[] = [];
    if (data['title'].length < 3 || data['title'].length > 80) messages.push('Title must contain 3–80 characters.');
    if (data['email'].length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data['email'])) messages.push('Enter a valid email address.');
    const items = Number(data['affectedItems']);
    if (!/^\d+$/.test(data['affectedItems']) || items < 1 || items > 100) messages.push('Affected items must be a whole number from 1 to 100.');
    if (data['details'].length < 10 || data['details'].length > 500) messages.push('Details must contain 10–500 characters.');
    if (messages.length) result.issues.push({ line: record.line, messages });
    else result.valid.push({ title: data['title'], email: data['email'], affectedItems: items, details: data['details'] });
  }
  return result;
}

export const SAMPLE_CSV = `title,email,affectedItems,details
"Fix mobile layout",alex@example.test,2,"The checkout button overlaps the footer on mobile."
"Improve search, including accents",sam@example.test,1,"Make the product search match accented text."
"",invalid-email,1.5,"Too short"`;
