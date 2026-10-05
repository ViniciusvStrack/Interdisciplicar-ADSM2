import { expect, test } from '@playwright/test'

test('repete Pix com matrícula existente no MySQL real', async ({ page }) => {
  test.skip(process.env.RUN_LIVE_DEMO !== '1', 'Teste opcional: backend/MySQL iniciados e aluno demo já inscrito em Muay Thai.')
  await page.goto('/')
  await page.locator('.class-list article').filter({ has: page.getByRole('heading', { name: 'Muay Thai', exact: true }) }).getByRole('button', { name: 'Inscrever-se' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill('aluno@spirithard.com')
  await page.getByLabel('Senha', { exact: true }).fill('Aluno@123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento demonstrativo' })).toBeVisible()
  const beforeResponse = await page.request.get('http://127.0.0.1:8080/api/student/dashboard')
  expect(beforeResponse.ok()).toBe(true)
  const before = await beforeResponse.json()
  const existing = before.enrollments.find((item: { className: string; status: string }) => item.className === 'Muay Thai' && item.status === 'CONFIRMED')
  expect(existing).toBeTruthy()
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole('radio', { name: /^Pix/ }).check()
    await page.getByRole('button', { name: 'Confirmar pagamento simulado' }).click()
    await expect(page.getByRole('heading', { name: 'Inscrição confirmada!' })).toBeVisible()
    await expect(page.getByText(`#${existing.id}`, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Ver minha agenda' }).click()
    if (attempt === 0) await page.locator('.class-list article').filter({ has: page.getByRole('heading', { name: 'Muay Thai', exact: true }) }).getByRole('button', { name: 'Inscrever-se' }).click()
  }
  const afterResponse = await page.request.get('http://127.0.0.1:8080/api/student/dashboard')
  const after = await afterResponse.json()
  expect(after.enrollments).toEqual(before.enrollments)
  await page.getByRole('button', { name: 'Sair' }).click()
})
