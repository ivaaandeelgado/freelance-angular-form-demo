import { test, expect } from '@playwright/test';

test('rejects empty input and validates a normalized, typed sample', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', {name:'Validate request', exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Please correct the highlighted fields.'})).toBeVisible();
  await expect(page.getByTestId('payload')).toHaveCount(0);
  await page.getByRole('button', {name:'Load example'}).click();
  await page.getByRole('textbox', {name:'Request title'}).fill('  Fix form validation  ');
  await page.getByRole('button', {name:'Validate request', exact:true}).click();
  await expect(page.getByRole('status')).toBeVisible();
  const payload = JSON.parse(await page.getByTestId('payload').innerText());
  expect(payload.title).toBe('Fix form validation');
  expect(payload.affectedItems).toBe(2);
  expect(typeof payload.affectedItems).toBe('number');
  expect(errors).toEqual([]);
  await page.screenshot({path:'evidence/desktop-validated.png', fullPage:true});
});

test('blocks malformed email, whitespace-only text and fractional quantities; reset clears results', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Load example'}).click();
  await page.getByRole('textbox', {name:'Contact email'}).fill('invalid-email');
  await page.getByRole('spinbutton', {name:'Affected items'}).fill('1.5');
  await page.getByRole('textbox', {name:'Request title'}).fill('     ');
  await page.getByRole('button', {name:'Validate request', exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Please correct the highlighted fields.'})).toBeVisible();
  await expect(page.getByText('Enter a valid email address.', {exact:true})).toBeVisible();
  await expect(page.getByText('Use a whole number from 1 to 100.', {exact:true})).toBeVisible();
  await expect(page.getByText('Enter a title containing 3–80 non-space characters.', {exact:true})).toBeVisible();
  await expect(page.getByTestId('payload')).toHaveCount(0);
  await page.getByRole('button', {name:'Load example'}).click();
  await page.getByRole('button', {name:'Validate request', exact:true}).click();
  await expect(page.getByTestId('payload')).toBeVisible();
  await page.getByRole('button', {name:'Reset', exact:true}).click();
  await expect(page.getByTestId('payload')).toHaveCount(0);
  await expect(page.getByRole('textbox', {name:'Request title'})).toHaveValue('');
});

test('fits a mobile viewport and completes the same validation flow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button', {name:'Load example'}).click();
  await page.getByRole('button', {name:'Validate request', exact:true}).click();
  await expect(page.getByTestId('payload')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({path:'evidence/mobile-validated.png', fullPage:true});
});
