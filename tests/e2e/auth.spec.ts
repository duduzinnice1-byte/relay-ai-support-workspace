import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "demo@relay.app";
const PASSWORD = process.env.E2E_PASSWORD ?? "relaydemo123";

test("landing renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /operations desk/i }),
  ).toBeVisible();
});

test("protected route redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("demo user can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Relay Demo/i)).toBeVisible();
});
