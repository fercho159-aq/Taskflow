import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

export const handler: Handler = async (event) => {
  try {
    const userId = event.headers['x-user-id']
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'User ID is required' }),
      }
    }

    const store = getStore({
      name: 'taskflow',
      token: process.env.NETLIFY_BLOBS_TOKEN
    })

    if (event.httpMethod === 'GET') {
      try {
        const result = await store.get(`data-${userId}`)
        const data = result ? JSON.parse(result.toString()) : { people: [], clients: [] }
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        }
      } catch (error) {
        return {
          statusCode: 200,
          body: JSON.stringify({ people: [], clients: [] }),
        }
      }
    }

    if (event.httpMethod === 'POST' && event.body) {
      const data = event.body
      const blob = new Blob([data], { type: 'application/json' })
      await store.set(`data-${userId}`, blob)
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
