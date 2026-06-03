import { expect, test } from "@playwright/test";

test("guest screen and admin dashboard work", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible({
    timeout: 60000,
  });

  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Quản lý dashboard")).toBeVisible({
    timeout: 60000,
  });

  await page.getByRole("button", { name: "Lịch hẹn" }).click();
  await expect(page.getByText("Quản lý lịch hẹn")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
