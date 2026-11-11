import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('gold path at phone width', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '把想去的地方，排成走得通的几天。' })).toBeVisible()
  await expect(page.getByText('一次三套，数字可对比')).toBeVisible()
  await expect(page.getByText('途灵 TripGenie')).toBeVisible()

  await page.getByRole('button', { name: '生成行程' }).click()
  await expect(page.getByText('先填写这次出行的基本条件。')).toBeVisible()
  await page.getByRole('button', { name: '杭州' }).click()
  await page.getByRole('button', { name: '增加人数' }).click()
  await page.getByRole('button', { name: '亲子' }).click()
  await page.getByRole('button', { name: '美食' }).click()
  await page.getByRole('button', { name: '生成行程' }).click()

  await expect(page.getByText('行程已用备用方案生成，地点和花费仍按既定规则计算，可以照常对比。')).toBeVisible()
  await expect(page.getByText('行程站点数').first()).toBeVisible()
  await expect(page.getByText('市内移动').first()).toBeVisible()
  await expect(page.getByText('门票合计').first()).toBeVisible()
  await expect(page.getByText('步行衔接').first()).toBeVisible()
  await expect(page.getByText('适合想多打卡')).toBeVisible()
  await expect(page.getByText('推荐')).toHaveCount(0)
  const openers = page.getByRole('button', { name: '查看这套行程' })
  await expect(openers).toHaveCount(3)

  const compact = page.locator('article.choice.compact')
  await expect(compact).toHaveCSS('border-radius', '12px')
  const bar = await compact.evaluate((node) => getComputedStyle(node, '::before').backgroundColor)
  expect(bar).toBe('rgb(59, 111, 245)')

  await openers.first().click()
  await expect(page.getByText('下列花费含门票、餐饮和市内交通，住宿未计入。')).toBeVisible()
  await expect(page.getByText(/第 1 天 · 西湖 ·/)).toBeVisible()
  await expect(page.getByText('地图按当天先后顺序标注，仅表示走法，不提供导航。')).toBeVisible()
  await expect(page.locator('.tuli-pin span').first()).toHaveText('1')
  await expect(page.locator('.leaflet-overlay-pane svg').first()).toBeVisible()
  await expect(page.getByText('下一站')).toBeVisible()
  await expect(page.getByText('西溪')).toHaveCount(0)

  await page.getByRole('button', { name: '第2天' }).click()
  await expect(page.getByText(/第 2 天 · 灵隐 ·/)).toBeVisible()
  await page.getByRole('button', { name: '第3天' }).click()
  await expect(page.getByText(/第 3 天 · 湖滨吴山 ·/)).toBeVisible()

  await page.getByRole('button', { name: /断桥残雪|飞来峰|胡雪岩/ }).first().click()
  await expect(page.locator('.place-card').getByText('停留', { exact: true })).toBeVisible()
  await expect(page.locator('.place-card').getByText('门票', { exact: true })).toBeVisible()
  await expect(page.locator('.place-card').getByText('贴士', { exact: true })).toBeVisible()
  await expect(page.locator('.place-card').getByText('来源', { exact: true })).toBeVisible()
  await expect(page.locator('.place-card').getByText('闭馆日', { exact: true })).toBeVisible()

  const primary = page.getByRole('button', { name: '保存到攻略' })
  const box = await primary.boundingBox()
  expect(box && box.height).toBeGreaterThanOrEqual(44)

  const saved = await request.post('http://127.0.0.1:8000/api/trips', {
    data: {
      city: '杭州',
      days: 1,
      people: 2,
      budget_total: 200,
      style: 'relaxed',
      itinerary: [
        {
          day: 1,
          zone: '西湖',
          theme: '湖上',
          items: [
            {
              time_start: '09:00',
              time_end: '10:00',
              type: 'attraction',
              title: '断桥残雪',
              poi: { name: '断桥残雪', lat: 30.25, lng: 120.15, adcode: '' },
              duration_min: 60,
              cost_estimate: 0,
            },
            {
              time_start: '10:20',
              time_end: '11:20',
              type: 'attraction',
              title: '孤山公园',
              poi: { name: '孤山公园', lat: 30.25, lng: 120.14, adcode: '' },
              duration_min: 60,
              cost_estimate: 0,
            },
          ],
        },
      ],
      cost_breakdown: { transport: 0, food: 0, tickets: 0, hotel: 0, other: 0 },
    },
  })
  expect(saved.ok()).toBeTruthy()
  const { id } = (await saved.json()) as { id: string }
  const read = await request.get(`http://127.0.0.1:8000/api/trips/${id}`)
  expect(read.ok()).toBeTruthy()

  await page.goto(`/share/${id}`)
  await expect(page.getByRole('button', { name: '导入到我的攻略' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '页面' })).toHaveCount(0)
  await page.getByRole('button', { name: '导入到我的攻略' }).click()
  await expect(page.getByText('已导入到「攻略」，可以打开查看或再调整。')).toBeVisible()
})

test('empty guide and failed generate', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: '页面' }).getByRole('button', { name: '攻略' }).click()
  const headerAction = page.getByRole('button', { name: '生成行程' }).first()
  const headerBox = await headerAction.boundingBox()
  expect(headerBox && headerBox.height).toBeGreaterThanOrEqual(44)
  expect(headerBox && headerBox.height).toBeLessThan(56)
  await expect(page.getByRole('heading', { name: '还没有保存的行程。' })).toBeVisible()
  await expect(page.getByRole('button', { name: '去社区看看' })).toBeVisible()
  await page.getByRole('navigation', { name: '页面' }).getByRole('button', { name: '社区' }).click()
  await expect(page.getByRole('heading', { name: '看看别人怎么逛。' })).toBeVisible()
  await expect(page.getByRole('button', { name: '写点评' })).toBeVisible()
  await page.getByRole('navigation', { name: '页面' }).getByRole('button', { name: '攻略' }).click()

  await page.getByRole('button', { name: '生成行程' }).first().click()
  await page.route('**/api/trip/generate', (route) => route.abort())
  await page.getByRole('button', { name: '生成行程' }).click()
  await expect(page.getByText('这次没有生成成功，请检查条件后重试。')).toBeVisible()
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})
