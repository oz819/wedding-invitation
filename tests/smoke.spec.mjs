import { test, expect } from "@playwright/test";

// Fonts come from Google. Block them so a network hiccup never fails the check.
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
});

async function openInvitation(page) {
  await page.goto("/");
  await page.locator("#seal").click();
  await expect(page.locator("#gate")).toBeHidden({ timeout: 5_000 });
}

test("the page is Arabic, right-to-left and titled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle(/دعوة/);
});

test("the seal opens the invitation without script errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openInvitation(page);
  await expect(page.locator("#rsvp")).toBeAttached();
  expect(errors).toEqual([]);
});

test("the opened page does not scroll sideways", async ({ page }) => {
  await openInvitation(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the attendance form needs a name, then thanks the guest", async ({ page }) => {
  await openInvitation(page);
  const form = page.locator("#rsvp");
  await form.locator('button[type="submit"]').click();
  await expect(page.locator("#err")).toBeVisible();

  await page.locator("#gName").fill("ضيف تجريبي");
  await form.locator('button[type="submit"]').click();
  await expect(page.locator("#thanks")).toBeVisible();
  await expect(page.locator("#thTitle")).toContainText("ضيف تجريبي");
});
