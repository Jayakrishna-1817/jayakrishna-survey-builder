import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.post('/api/auth/login', async (c) => {
  const { email } = await c.req.json()
  if (!email) return c.json({ error: 'Email required' }, 400)

  const db = c.env.DB
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

  if (!user) {
    const id = crypto.randomUUID()
    await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run()
    user = { id, email }
  }

  const token = await sign({ userId: user.id, email: user.email }, 'supersecretkey', 'HS256')
  return c.json({ token, user })
})

app.use('/api/surveys/*', jwt({ secret: 'supersecretkey', alg: 'HS256' }))

app.get('/api/surveys', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  const surveys = await db
    .prepare('SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(payload.userId)
    .all()
  return c.json(surveys.results.map((s) => ({ ...s, questions: JSON.parse(s.questions) })))
})

app.post('/api/surveys', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  const data = await c.req.json()
  const id = crypto.randomUUID()
  await db
    .prepare(
      'INSERT INTO surveys (id, user_id, title, description, primary_color, logo_url, questions) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      payload.userId,
      data.title,
      data.description || '',
      data.primaryColor || '#3b82f6',
      data.logoUrl || '',
      JSON.stringify(data.questions || []),
    )
    .run()
  return c.json({ id, ...data })
})

app.get('/api/surveys/:id', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), payload.userId)
    .first()
  if (!survey) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...survey, questions: JSON.parse(survey.questions) })
})

app.put('/api/surveys/:id', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  const data = await c.req.json()
  await db
    .prepare(
      'UPDATE surveys SET title = ?, description = ?, primary_color = ?, logo_url = ?, questions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    )
    .bind(
      data.title,
      data.description || '',
      data.primaryColor || '#3b82f6',
      data.logoUrl || '',
      JSON.stringify(data.questions || []),
      c.req.param('id'),
      payload.userId,
    )
    .run()
  return c.json({ success: true })
})

app.delete('/api/surveys/:id', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  await db.prepare('DELETE FROM responses WHERE survey_id = ?').bind(c.req.param('id')).run()
  await db
    .prepare('DELETE FROM surveys WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), payload.userId)
    .run()
  return c.json({ success: true })
})

app.get('/api/surveys/:id/responses', async (c) => {
  const payload = c.get('jwtPayload')
  const db = c.env.DB
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), payload.userId)
    .first()
  if (!survey) return c.json({ error: 'Not found' }, 404)
  const responses = await db
    .prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY created_at DESC')
    .bind(c.req.param('id'))
    .all()
  return c.json(responses.results.map((r) => ({ ...r, answers: JSON.parse(r.answers) })))
})

app.get('/api/public/surveys/:id', async (c) => {
  const db = c.env.DB
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!survey) return c.json({ error: 'Not found' }, 404)
  return c.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    primaryColor: survey.primary_color,
    logoUrl: survey.logo_url,
    questions: JSON.parse(survey.questions),
  })
})

app.post('/api/public/surveys/:id/responses', async (c) => {
  const db = c.env.DB
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!survey) return c.json({ error: 'Not found' }, 404)
  const data = await c.req.json()
  const id = crypto.randomUUID()
  await db
    .prepare('INSERT INTO responses (id, survey_id, answers) VALUES (?, ?, ?)')
    .bind(id, survey.id, JSON.stringify(data.answers))
    .run()
  return c.json({ success: true })
})

export default app
