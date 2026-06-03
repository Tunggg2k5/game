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

test("patient booking shows simple time slots", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bệnh nhân", exact: true }).click();
  await expect(page.getByText("Bệnh nhân dashboard")).toBeVisible({
    timeout: 60000,
  });

  await page.getByRole("button", { name: "Đặt lịch" }).click();
  await expect(page.getByRole("button", { name: "07:00" })).toBeVisible();
  await expect(page.getByRole("button", { name: "07:30" })).toBeVisible();
});

test("receptionist has pending appointments and clinic flow screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lễ tân" }).click();
  await expect(page.getByText("Lễ tân dashboard")).toBeVisible({
    timeout: 60000,
  });

  await page.getByRole("button", { name: "Lịch hẹn" }).click();
  await expect(page.getByText("Lịch chờ xác nhận")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xác nhận" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Điều phối" }).click();
  await expect(page.getByText("Điều phối phòng khám")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Slot" })).toBeVisible();
});
