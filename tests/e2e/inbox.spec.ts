import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "demo@relay.app";
const PASSWORD = process.env.E2E_PASSWORD ?? "relaydemo123";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("inbox lists seeded tickets and opens a ticket detail", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

  const ticket = page.getByText(/Webhook retries spiking/i);
  await expect(ticket).toBeVisible();
  await ticket.click();

  await expect(page).toHaveURL(/\/inbox\/[0-9a-f-]+/);
  await expect(page.getByRole("button", { name: /Summarize/i })).toBeVisible();
});

test("status filter persists in the URL", async ({ page }) => {
  await page.goto("/inbox");
  // The status tab is the only "Open" control followed by a count.
  await page.getByRole("button", { name: /^Open\s*\d/ }).click();
  await expect(page).toHaveURL(/status=open/);
});
