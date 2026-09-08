import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Application } from '../src/application';
import type { RectangleData } from '../src/rectangle';
import { SPAWN_LIMITS } from '../src/spawn';

declare global {
  interface Window {
    application?: Application;
  }
}

const group = (page: Page, id: number): Locator => page.locator(`g[aria-label="Rectangle ${id}"]`);
const body = (page: Page, id: number): Locator => group(page, id).locator('rect');
const handle = (page: Page, id: number): Locator => group(page, id).locator('circle.radius-handle');

const modelOf = (page: Page, id: number) =>
  page.evaluate((rectId) => window.application!.getRectById(rectId)!.toJSON(), id);

/** Drag from one absolute viewport position to another. */
const drag = async (page: Page, fromX: number, fromY: number, toX: number, toY: number) => {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(toX, toY, { steps: 8 });
  await page.mouse.up();
};

const strokeWidthOf = async (page: Page, id: number): Promise<number> =>
  page.evaluate((rectId) => {
    const rect = document.querySelector(`g[aria-label="Rectangle ${rectId}"] rect`)!;
    return parseFloat(getComputedStyle(rect).strokeWidth);
  }, id);

test.describe('rounded rectangle editor', () => {
  test('renders the initial scene from the task description', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('g.rectangle')).toHaveCount(3);
    expect(await modelOf(page, 0)).toEqual({
      id: 0,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      radius: 10,
    });
    await expect(body(page, 0)).toHaveAttribute('x', '100');
    await expect(body(page, 0)).toHaveAttribute('rx', '10');
  });

  test('supports the task-description scenario through the public API', async ({ page }) => {
    await page.goto('/');

    const json = await page.evaluate(() => {
      const rect = window.application!.getRectById(1)!;
      rect.setSize(100, 100);
      rect.setPosition(10, 10);
      rect.setCornerRadius(5);
      return rect.toJSON();
    });

    expect(json).toEqual({ id: 1, width: 100, height: 100, x: 10, y: 10, radius: 5 });

    // API edits are reflected live in the UI.
    await expect(body(page, 1)).toHaveAttribute('x', '10');
    await expect(body(page, 1)).toHaveAttribute('y', '10');
    await expect(body(page, 1)).toHaveAttribute('width', '100');
    await expect(body(page, 1)).toHaveAttribute('height', '100');
    await expect(body(page, 1)).toHaveAttribute('rx', '5');
    await expect(body(page, 1)).toHaveAttribute('ry', '5');
  });

  test('returns null for an unknown id', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => window.application!.getRectById(999))).toBeNull();
  });

  test('dragging the body moves the rectangle', async ({ page }) => {
    await page.goto('/');

    const box = (await body(page, 0).boundingBox())!;
    await drag(
      page,
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + box.width / 2 + 120,
      box.y + box.height / 2 + 60,
    );

    expect(await modelOf(page, 0)).toEqual({
      id: 0,
      x: 220,
      y: 160,
      width: 200,
      height: 150,
      radius: 10,
    });
  });

  test('dragging the corner handle changes the radius of all four corners', async ({ page }) => {
    await page.goto('/');

    // Rect 0: corner (300, 100), handle starts at (290, 110) for radius 10.
    // Dragging to (240, 160) leaves a distance of sqrt(60^2 + 60^2) to the
    // corner, i.e. radius 60.
    const box = (await handle(page, 0).boundingBox())!;
    await drag(
      page,
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + box.width / 2 - 50,
      box.y + box.height / 2 + 50,
    );

    expect((await modelOf(page, 0)).radius).toBeCloseTo(60, 5);

    // rx/ry apply to all four corners at once.
    const shape = await page.evaluate(() => {
      const rect = document.querySelector('g[aria-label="Rectangle 0"] rect')!;
      return {
        rx: parseFloat(rect.getAttribute('rx')!),
        ry: parseFloat(rect.getAttribute('ry')!),
      };
    });
    expect(shape.rx).toBeCloseTo(60, 5);
    expect(shape.ry).toBeCloseTo(60, 5);

    // The handle follows the pointer onto the new corner arc.
    const circle = await page.evaluate(() => {
      const c = document.querySelector('g[aria-label="Rectangle 0"] circle.radius-handle')!;
      return { cx: parseFloat(c.getAttribute('cx')!), cy: parseFloat(c.getAttribute('cy')!) };
    });
    expect(circle.cx).toBeCloseTo(240, 5);
    expect(circle.cy).toBeCloseTo(160, 5);
  });

  test('radius dragging clamps at the maximum for the current size', async ({ page }) => {
    await page.goto('/');

    const box = (await handle(page, 0).boundingBox())!;
    await drag(
      page,
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + box.width / 2 + 300,
      box.y + box.height / 2 + 200,
    );

    // maxRadius = min(200, 150) / 2
    expect((await modelOf(page, 0)).radius).toBe(75);
  });

  test('shows a wide bright border on the selected rectangle', async ({ page }) => {
    await page.goto('/');

    await expect(body(page, 0)).toHaveAttribute('stroke', 'rgba(0, 0, 0, 0.35)');
    expect(await strokeWidthOf(page, 0)).toBe(1.5);

    const box = (await body(page, 0).boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();

    // Bright companion color of the purple fill + wider border while selected.
    await expect(body(page, 0)).toHaveAttribute('stroke', '#e254ff');
    expect(await strokeWidthOf(page, 0)).toBe(4);
    await expect(group(page, 0)).toHaveClass(/active/);

    await page.mouse.up();

    await expect(body(page, 0)).toHaveAttribute('stroke', 'rgba(0, 0, 0, 0.35)');
    expect(await strokeWidthOf(page, 0)).toBe(1.5);
    await expect(group(page, 0)).not.toHaveClass(/active/);
  });

  test('raises the dragged rectangle to the front and keeps its color stable', async ({ page }) => {
    await page.goto('/');

    await expect(body(page, 0)).toHaveAttribute('fill', '#8e24aa');
    await expect(body(page, 1)).toHaveAttribute('fill', '#1e88e5');

    const box = (await body(page, 0).boundingBox())!;
    await drag(
      page,
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + box.width / 2 + 30,
      box.y + box.height / 2 + 30,
    );

    const order = await page.evaluate(() =>
      [...document.querySelectorAll('g.rectangle')].map((g) => g.getAttribute('aria-label')),
    );
    expect(order.at(-1)).toBe('Rectangle 0');

    // Colors must not shuffle when the z-order changes.
    await expect(body(page, 0)).toHaveAttribute('fill', '#8e24aa');
    await expect(body(page, 1)).toHaveAttribute('fill', '#1e88e5');
  });

  test('adds new rectangles at runtime', async ({ page }) => {
    await page.goto('/');

    const add = page.getByRole('button', { name: /add rectangle/i });
    await add.click();
    await add.click();

    await expect(page.locator('g.rectangle')).toHaveCount(5);

    const third = await page.evaluate(() => window.application!.getRectById(3)!.toJSON());
    const fourth = await page.evaluate(() => window.application!.getRectById(4)!.toJSON());
    expect(third.width).toBeGreaterThanOrEqual(SPAWN_LIMITS.minWidth);
    expect(third.width).toBeLessThanOrEqual(SPAWN_LIMITS.maxWidth);
    expect(fourth.height).toBeGreaterThanOrEqual(SPAWN_LIMITS.minHeight);
    expect(fourth.height).toBeLessThanOrEqual(SPAWN_LIMITS.maxHeight);
    expect(third.radius).toBeLessThanOrEqual(Math.min(third.width, third.height) / 2);
    expect(fourth.radius).toBeLessThanOrEqual(Math.min(fourth.width, fourth.height) / 2);

    // A freshly added rectangle behaves like any other: draggable. Rect 4 was
    // added last, so it is on top and its center wins the hit test over the
    // potentially overlapping rect 3.
    const box = (await body(page, 4).boundingBox())!;
    await drag(
      page,
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + box.width / 2 + 40,
      box.y + box.height / 2 + 40,
    );
    expect(await modelOf(page, 4)).toMatchObject({ x: fourth.x + 40, y: fourth.y + 40 });
    expect(await modelOf(page, 3)).toMatchObject({ x: third.x, y: third.y });
  });

  test('initialises from a global rectanglesData list', async ({ page }) => {
    const customData: RectangleData[] = [
      { id: 7, x: 10, y: 20, width: 300, height: 400, radius: 5 },
      { id: 9, x: 500, y: 300, width: 100, height: 100, radius: 25 },
    ];
    await page.addInitScript((data) => {
      window.rectanglesData = data;
    }, customData);

    await page.goto('/');

    expect(await modelOf(page, 7)).toEqual(customData[0]);
    expect(await modelOf(page, 9)).toEqual(customData[1]);
    expect(await page.evaluate(() => window.application!.getRectById(0))).toBeNull();
    await expect(page.locator('g.rectangle')).toHaveCount(2);
  });
});
