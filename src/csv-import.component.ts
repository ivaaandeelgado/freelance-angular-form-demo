import { Component, signal } from '@angular/core';
import { CSV_LIMIT, importRequests, SAMPLE_CSV } from './csv-import';
import type { ImportReport } from './csv-import';

@Component({
  selector: 'app-csv-import', standalone: true,
  template: `
    <section class="panel import-panel" aria-labelledby="import-heading">
      <div class="panel-heading"><div><p class="eyebrow">03 / BATCH IMPORT</p><h2 id="import-heading">Check a CSV before importing</h2></div><span class="status">Browser only</span></div>
      <p class="muted">Validate up to 250 requests. Review rejected rows, then download only the valid records as JSON.</p>
      <div class="import-grid">
        <div>
          <label class="csv-label" for="csv-file">Choose a CSV file</label>
          <input id="csv-file" type="file" accept=".csv,text/csv" (change)="loadFile($event)" />
          <label class="csv-label" for="csv-source">Or paste CSV text</label>
          <textarea id="csv-source" rows="8" spellcheck="false" [maxLength]="limit" [value]="source()" (input)="edit($event)" aria-describedby="csv-help"></textarea>
          <p id="csv-help" class="muted">Headers: title, email, affectedItems, details. Comma or semicolon separators; quoted commas and line breaks are supported. Use synthetic data.</p>
          <div class="actions"><button class="primary-button" type="button" (click)="validate()" [disabled]="busy()">Validate CSV</button><button type="button" class="text-button" (click)="sample()">Load CSV sample</button><button type="button" class="text-button" (click)="clear()">Clear CSV</button></div>
          @if (fileError()) { <p class="error-summary" role="alert">{{ fileError() }}</p> }
          @if (busy()) { <p class="muted" role="status">Reading local file…</p> }
        </div>
        <div>
          @if (report(); as result) {
            <p class="import-summary" role="status">{{ result.valid.length }} valid · {{ result.issues.length }} rejected</p>
            @if (result.valid.length) {
              <div class="table-scroll"><table><caption>Valid requests</caption><thead><tr><th>Title</th><th>Items</th></tr></thead><tbody>@for (row of result.valid; track $index) { <tr><td>{{ row.title }}</td><td>{{ row.affectedItems }}</td></tr> }</tbody></table></div>
              <button type="button" class="primary-button export-button" (click)="download()">Download valid JSON</button>
            }
            @if (result.issues.length) {
              <div class="import-issues" role="region" aria-label="CSV errors"><h3>Rows to correct</h3><ul>@for (issue of result.issues; track $index) { <li><strong>Line {{ issue.line }}</strong>: {{ issue.messages.join(' ') }}</li> }</ul></div>
            }
          } @else { <div class="empty-state"><h3>Keep errors out of your import</h3><p>Preview valid rows and get an explanation for each rejected row. Editing the source clears previous results.</p></div> }
        </div>
      </div>
    </section>`
})
export class CsvImportComponent {
  readonly limit = CSV_LIMIT;
  source = signal(''); report = signal<ImportReport | null>(null); fileError = signal(''); busy = signal(false);
  private readId = 0;
  private resetResult() { this.report.set(null); this.fileError.set(''); }
  edit(event: Event) { this.readId++; this.busy.set(false); this.source.set((event.target as HTMLTextAreaElement).value); this.resetResult(); }
  sample() { this.readId++; this.busy.set(false); this.source.set(SAMPLE_CSV); this.resetResult(); }
  clear() { this.readId++; this.busy.set(false); this.source.set(''); this.resetResult(); }
  validate() { this.resetResult(); this.report.set(importRequests(this.source())); }
  async loadFile(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0]; element.value = '';
    if (!file) return;
    const id = ++this.readId;
    this.resetResult(); this.source.set(''); this.busy.set(false);
    if (file.size > CSV_LIMIT) { this.fileError.set('Choose a CSV file no larger than 200,000 bytes.'); return; }
    this.busy.set(true);
    try { const text = await file.text(); if (id === this.readId) this.source.set(text); }
    catch { if (id === this.readId) this.fileError.set('This file could not be read. Try another CSV file.'); }
    finally { if (id === this.readId) this.busy.set(false); }
  }
  download() {
    const rows = this.report()?.valid;
    if (!rows?.length) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'validated-requests.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
