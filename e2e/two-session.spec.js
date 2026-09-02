import { expect, test } from '@playwright/test';

test('two browser sessions receive a shared editor update', async ({ browser, baseURL }) => {
  const interviewer = await browser.newContext();
  const candidate = await browser.newContext();
  const interviewerPage = await interviewer.newPage();
  const candidatePage = await candidate.newPage();

  await interviewerPage.goto(baseURL);
  await interviewerPage.getByRole('button', { name: 'Create interview room' }).click();
  await interviewerPage.waitForURL(/\/room\/[a-f0-9]{8}$/);
  const roomUrl = interviewerPage.url();

  await candidatePage.goto(roomUrl);
  await expect(interviewerPage.locator('.status')).toHaveText('connected');
  await expect(candidatePage.locator('.status')).toHaveText('connected');

  const editor = candidatePage.locator('.cm-content');
  await editor.click();
  await editor.press('ControlOrMeta+A');
  await editor.pressSequentially('console.log("shared from candidate")');

  await expect(interviewerPage.locator('.cm-content')).toContainText('shared from candidate');

  await interviewer.close();
  await candidate.close();
});
