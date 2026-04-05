import { expect, test } from '@playwright/test'

test('2D teaching flow supports scenario switching, editing, stepping, and reset', async ({ page }) => {
  await page.goto('/#/affine-2d')
  await expect(page.getByTestId('affine-2d-view')).toBeVisible()

  const reflectScenario = page.getByTestId('scenario-card-2d-reflect-shear')
  await reflectScenario.click()
  await expect(reflectScenario).toHaveAttribute('aria-pressed', 'true')

  const firstPointX = page.getByTestId('point-input-0-0')
  await firstPointX.fill('22')
  await firstPointX.press('Enter')
  await expect(firstPointX).toHaveValue('22')

  await page.getByTestId('draft-type-select').selectOption('scale')
  await page.getByTestId('draft-field-sx').fill('1.5')
  await page.getByTestId('draft-field-sy').fill('0.75')
  await page.getByTestId('reset-draft-button').click()
  await expect(page.getByTestId('draft-field-sx')).toHaveValue('1.2')
  await expect(page.getByTestId('draft-field-sy')).toHaveValue('0.9')
  await page.getByTestId('draft-field-sx').fill('1.5')
  await page.getByTestId('draft-field-sy').fill('0.75')
  await page.getByTestId('add-transform-button').click()
  await expect(page.getByTestId('transform-item-3')).toContainText('Scaling')

  await page.getByTestId('step-forward-button').click()
  await expect(page.getByTestId('transform-item-1')).toHaveClass(/active/)

  await page.getByTestId('reset-animation-button').click()
  await expect(page.getByTestId('transform-item-0')).toHaveClass(/active/)

  await page.getByTestId('restore-default-scenario-button').click()
  await expect(page.getByTestId('scenario-card-2d-step-chain')).toHaveAttribute('aria-pressed', 'true')
})

test('3D teaching flow supports point-cloud scenario, playback controls, wireframe mode switching, and default restore', async ({ page }) => {
  await page.goto('/#/affine-3d')
  await expect(page.getByTestId('affine-3d-view')).toBeVisible()

  const pointCloudScenario = page.getByTestId('scenario-card-3d-point-cloud')
  await pointCloudScenario.click()
  await expect(pointCloudScenario).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('wireframe-mode-select')).toHaveValue('sequential')
  await expect(page.getByTestId('transform-item-2')).toContainText('dx=1, dy=1.6, dz=-0.8')

  await page.getByTestId('speed-slider').fill('100')
  await page.getByTestId('start-animation-button').click()
  await expect(page.getByTestId('pause-animation-button')).toBeEnabled()
  await expect(page.getByTestId('start-animation-button')).toBeDisabled()
  await expect(page.getByTestId('transform-item-1')).toHaveClass(/active/, { timeout: 4000 })
  await page.getByTestId('pause-animation-button').click()

  await page.getByTestId('wireframe-mode-select').selectOption('cube')
  await expect(page.getByTestId('wireframe-mode-pill')).toContainText('Cube Edges')

  await page.getByTestId('draft-type-select').selectOption('translate')
  await page.getByTestId('draft-field-dx').fill('3.3')
  await page.getByTestId('draft-field-dy').fill('-2')
  await page.getByTestId('draft-field-dz').fill('0.1')
  await page.getByTestId('reset-draft-button').click()
  await expect(page.getByTestId('draft-field-dx')).toHaveValue('0.8')
  await expect(page.getByTestId('draft-field-dy')).toHaveValue('0.4')
  await expect(page.getByTestId('draft-field-dz')).toHaveValue('-0.5')

  await page.getByTestId('reset-animation-button').click()
  await expect(page.getByTestId('transform-item-0')).toHaveClass(/active/)

  await page.getByTestId('restore-default-scenario-button').click()
  await expect(page.getByTestId('scenario-card-3d-cube-basics')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('wireframe-mode-select')).toHaveValue('auto')
})

test('2D keyboard interactions keep editing resilient for invalid drafts and escape rollback', async ({ page }) => {
  await page.goto('/#/affine-2d')
  await expect(page.getByTestId('affine-2d-view')).toBeVisible()

  const pointInput = page.getByTestId('point-input-0-0')
  const originalValue = await pointInput.inputValue()
  await pointInput.fill('-')
  await expect(page.getByText('Continue typing the number.')).toBeVisible()
  await pointInput.press('Escape')
  await expect(pointInput).toHaveValue(originalValue)

  await page.getByTestId('draft-type-select').selectOption('translate')
  const draftDx = page.getByTestId('draft-field-dx')
  await draftDx.fill('')
  await draftDx.press('Enter')
  await expect(page.getByText('Fix the highlighted transform parameter fields.')).toBeVisible()
  await expect(page.getByTestId('transform-item-3')).toBeHidden()

  await draftDx.press('Escape')
  await expect(draftDx).toHaveValue('20')
})

test('3D controls remain usable in narrow viewport with local-origin keyboard commit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/affine-3d')
  await expect(page.getByTestId('affine-3d-view')).toBeVisible()

  const originX = page.getByTestId('local-origin-input-0')
  await originX.fill('2.5')
  await originX.press('Enter')
  await expect(originX).toHaveValue('2.5')

  await page.getByTestId('start-animation-button').click()
  await expect(page.getByTestId('pause-animation-button')).toBeEnabled()
  await page.getByTestId('pause-animation-button').click()
})
