import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, provideZoneChangeDetection, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { IonButton, IonInput, IonTextarea, provideIonicAngular } from '@ionic/angular';
import { CsvImportComponent } from './csv-import.component';

const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() ? null : { blank: true };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, IonInput, IonTextarea, IonButton, CsvImportComponent],
  template: `
    <main>
      <header class="masthead"><span class="brand"><span class="brand-mark">ID</span> IVAN DELGADO</span><span class="pill">PERSONAL DEMONSTRATION</span></header>
      <section class="hero">
        <p class="eyebrow">ANGULAR + IONIC · WORKING SAMPLE</p>
        <h1>Small forms.<br><span>Reliable behavior.</span></h1>
        <p class="intro">A focused example of form validation, clear feedback and a clean handover between the interface and application logic.</p>
        <div class="tags"><span>Reactive Forms</span><span>Typed payload</span><span>Responsive layout</span></div>
      </section>
      <section class="workspace">
        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">01 / INPUT</p><h2>New support request</h2></div><span class="status">Interactive</span></div>
          <p class="muted">Try the example or enter your own test values.</p>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <ion-input label="Request title" labelPlacement="stacked" fill="outline" formControlName="title" placeholder="e.g. Fix the order confirmation form" [maxlength]="80" [counter]="true" errorText="Enter a title containing 3–80 non-space characters." />
            <div class="field-grid">
              <ion-input label="Contact email" labelPlacement="stacked" fill="outline" type="email" formControlName="email" placeholder="name@example.com" errorText="Enter a valid email address." />
              <ion-input label="Affected items" labelPlacement="stacked" fill="outline" type="number" min="1" max="100" step="1" formControlName="items" errorText="Use a whole number from 1 to 100." />
            </div>
            <ion-textarea label="Issue details" labelPlacement="stacked" fill="outline" formControlName="details" placeholder="Describe the expected and current behavior." [rows]="4" [maxlength]="500" [counter]="true" errorText="Describe the issue in 10–500 non-space characters." />
            <div class="actions"><ion-button type="submit">Validate request</ion-button><button type="button" class="text-button" (click)="loadSample()">Load example</button><button type="button" class="text-button subtle" (click)="reset()">Reset</button></div>
            @if (attempted() && form.invalid) { <p class="error-summary" role="alert">Please correct the highlighted fields. Nothing has been submitted.</p> }
            @if (result()) { <p class="success" role="status">Request validated. The preview contains the last validated values.</p> }
          </form>
        </article>
        <aside class="panel preview">
          <div class="panel-heading"><div><p class="eyebrow">02 / OUTPUT</p><h2>Validated payload</h2></div><span class="code-label">JSON</span></div>
          @if (result()) { <pre data-testid="payload">{{ result() | json }}</pre> }
          @else { <div class="empty-state"><span class="empty-icon">✓</span><h3>Validate before saving</h3><p>A structured payload appears here only after every field passes validation.</p></div> }
          <div class="checks"><p>Included in this sample</p><ul><li>Required fields and whitespace checks</li><li>Email and integer validation</li><li>Normalized, typed output</li><li>Reset and correction flows</li></ul></div>
        </aside>
      </section>
      <app-csv-import />
      <footer><p>Personal demonstration · Synthetic data · Not a client delivery</p><p>Runs locally. Data leaves the browser only when you download the JSON file.</p></footer>
    </main>`,
})
class AppComponent {
  attempted = signal(false);
  result = signal<{title: string; email: string; affectedItems: number; details: string} | null>(null);
  readonly trimmedLength = (min: number, max: number): ValidatorFn => control => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    return value.length >= min && value.length <= max ? null : { trimmedLength: true };
  };
  readonly integer: ValidatorFn = control => Number.isInteger(control.value) ? null : { integer: true };
  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [nonBlank, this.trimmedLength(3, 80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    items: new FormControl<number | null>(1, [Validators.required, Validators.min(1), Validators.max(100), this.integer]),
    details: new FormControl('', { nonNullable: true, validators: [nonBlank, this.trimmedLength(10, 500)] }),
  });
  submit() {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    this.result.set(null);
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.result.set({title: value.title.trim(), email: value.email.trim(), affectedItems: value.items!, details: value.details.trim()});
  }
  loadSample() {
    this.form.reset({title: 'Fix the order confirmation form', email: 'demo@example.com', items: 2, details: 'The confirmation button stays disabled after all required fields are completed.'});
    this.attempted.set(false);
    this.result.set(null);
  }
  reset() { this.form.reset({title: '', email: '', items: 1, details: ''}); this.attempted.set(false); this.result.set(null); }
}
bootstrapApplication(AppComponent, { providers: [provideZoneChangeDetection(), provideIonicAngular({mode: 'md'})] }).catch(console.error);
