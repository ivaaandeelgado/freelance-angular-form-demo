import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importRequests, SAMPLE_CSV } from '../src/csv-import.ts';
const header = 'title,email,affectedItems,details\n';
test('sample separates valid records from rejected records', () => {
  const result = importRequests(SAMPLE_CSV);
  assert.equal(result.total, 3); assert.equal(result.valid.length, 2);
  assert.equal(result.valid[1].title, 'Improve search, including accents');
  assert.equal(result.issues[0].line, 4); assert.equal(result.issues[0].messages.length, 4);
});
test('BOM, semicolon delimiter, reordered headers and escaped quotes', () => {
  const result = importRequests('\uFEFFemail;details;affectedItems;title\r\na@example.test;"Fix the ""save"" button";2;"  Layout fix  "');
  assert.equal(result.issues.length, 0); assert.equal(result.valid[0].title, 'Layout fix');
  assert.equal(result.valid[0].details, 'Fix the "save" button'); assert.equal(result.valid[0].affectedItems, 2);
});
test('quoted newlines preserve correct physical error line numbers', () => {
  const result = importRequests(header + 'Layout fix,a@example.test,2,"Expected first line\r\nand a second line"\r\nbad,bad,0,x');
  assert.equal(result.valid.length, 1); assert.equal(result.valid[0].details, 'Expected first line\nand a second line');
  assert.equal(result.issues[0].line, 4);
});
test('rejects malformed quotation and duplicate or missing headers', () => {
  for (const text of [header + '"Never closed', header + 'ab"cd,a@example.test,1,Long details here', header + '"Title"oops,a@example.test,1,Long details here', 'title,email,email,details\na,b,c,d', 'title,email\na,b']) {
    const result = importRequests(text); assert.equal(result.valid.length, 0); assert.equal(result.issues.length, 1);
  }
});
test('enforces input and row limits without returning a partial import', () => {
  assert.equal(importRequests('x'.repeat(200001)).valid.length, 0);
  const row = 'Fix layout,a@example.test,1,Long enough details\n';
  assert.equal(importRequests(header + row.repeat(250)).valid.length, 250);
  const over = importRequests(header + row.repeat(251)); assert.equal(over.valid.length, 0); assert.match(over.issues[0].messages[0], /250/);
});
test('requires data and rejects wrong column counts and invalid quantities', () => {
  for (const text of ['', header]) assert.equal(importRequests(text).issues.length, 1);
  for (const quantity of ['1.5', '0', '101', '1e1', 'NaN', '']) assert.equal(importRequests(header + `Fix layout,a@example.test,${quantity},Long enough details`).valid.length, 0);
  assert.equal(importRequests(header + 'One,two,three').issues[0].line, 2);
});
test('retains formula-like and HTML strings as plain JSON data', () => {
  const result = importRequests(header + '"=SUM(1,2)",a@example.test,1,<script>alert(1)</script>');
  assert.equal(result.valid[0].title, '=SUM(1,2)'); assert.equal(result.valid[0].details, '<script>alert(1)</script>');
});
