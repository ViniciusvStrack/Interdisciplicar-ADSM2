import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const item = { id: 11, name: 'Muay Thai', modality: 'Muay Thai', days: 'Segunda, quarta e sexta', timeRange: '19:00–20:00', instructor: 'A. Ribeiro', price: 80, capacity: 30, available: true }
const user = { id: 21, name: 'Aluno Teste', email: 'teste@example.com', phone: '81999990000', role: 'STUDENT' }
const enrollment = { id: 31, className: item.name, days: item.days, timeRange: item.timeRange, instructor: item.instructor, status: 'CONFIRMED' }

async function setup(page: Page, rejectEnrollment = false) {
  const state = { authenticated: false, submissions: 0, enrolled: false }
  await page.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173', 'Access-Control-Allow-Credentials': 'true' }
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, json: body })
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'content-type' } })
    if (path === '/api/catalog/classes') return json([item])
    if (path === '/api/auth/me') return json(state.authenticated ? user : { message: 'Entre para continuar' }, state.authenticated ? 200 : 401)
    if (path === '/api/auth/login' || path === '/api/auth/register') { state.authenticated = true; return json(user) }
    if (path === '/api/student/dashboard') return json({ enrollments: state.enrolled ? [enrollment] : [], classes: [item] })
    if (path === '/api/student/enrollments' && request.method() === 'POST') {
      state.submissions++
      expect(request.postDataJSON()).toEqual({ classOfferingId: item.id })
      if (rejectEnrollment) return json({ message: 'Turma lotada' }, 409)
      state.enrolled = true
      return json(enrollment, 201)
    }
    if (path === '/api/auth/logout') { state.authenticated = false; return route.fulfill({ status: 204, headers }) }
    return json({ message: 'Rota inesperada no teste' }, 404)
  })
  return state
}

async function chooseAndLogin(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Inscrever-se' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill('Teste@123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento demonstrativo' })).toBeVisible()
}

for (const method of ['Pix', 'Cartão', 'Boleto']) {
  test(`confirma inscrição com ${method} simulado, sem cobrança`, async ({ page }) => {
    const state = await setup(page)
    await chooseAndLogin(page)
    expect(state.submissions).toBe(0)
    await page.getByRole('radio', { name: new RegExp(`^${method}`) }).check()
    await expect(page.getByText('R$ 80,00', { exact: true })).toBeVisible()
    if (method === 'Pix') await page.screenshot({ path: test.info().outputPath('payment-desktop.png'), fullPage: true })
    await page.getByRole('button', { name: 'Confirmar pagamento simulado' }).click()
    await expect(page.getByRole('heading', { name: 'Inscrição confirmada!' })).toBeVisible()
    expect(state.submissions).toBe(1)
    await expect(page.getByText('R$ 0,00', { exact: true })).toBeVisible()
    await expect(page.getByText('#31', { exact: true })).toBeVisible()
    if (method === 'Pix') await page.screenshot({ path: test.info().outputPath('payment-confirmed.png'), fullPage: true })
    await page.getByRole('button', { name: 'Ver minha agenda' }).click()
    await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible()
  })
}

test('voltar do pagamento não cria matrícula', async ({ page }) => {
  const state = await setup(page)
  await chooseAndLogin(page)
  await page.getByRole('button', { name: 'Voltar às turmas' }).click()
  await expect(page.getByText('Você ainda não possui inscrições.')).toBeVisible()
  expect(state.submissions).toBe(0)
  await page.getByRole('button', { name: 'Inscrever-se' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento demonstrativo' })).toBeVisible()
})

test('erro de matrícula não exibe pagamento aprovado', async ({ page }) => {
  const state = await setup(page, true)
  await chooseAndLogin(page)
  await page.getByRole('button', { name: 'Confirmar pagamento simulado' }).click()
  await expect(page.getByRole('alert')).toHaveText('Turma lotada')
  await expect(page.getByRole('heading', { name: 'Inscrição confirmada!' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Confirmar pagamento simulado' })).toBeEnabled()
  expect(state.submissions).toBe(1)
})

test('pagamento e saída ficam acessíveis no celular', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const state = await setup(page)
  await chooseAndLogin(page)
  await expect(page.getByRole('button', { name: 'Confirmar pagamento simulado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(fitsViewport).toBe(true)
  await page.screenshot({ path: test.info().outputPath('payment-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('heading', { name: /Treine forte/ })).toBeVisible()
  expect(state.submissions).toBe(0)
})
