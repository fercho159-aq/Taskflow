import { Handler } from '@netlify/functions'
import { getKVStore } from '@netlify/blobs'

const store = getKVStore('taskflow')

export const handler: Handler = async (event) => {
  try {
    const userId = event.headers['x-user-id']
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'User ID is required' }),
      }
    }

    if (event.httpMethod === 'GET') {
      const data = await store.get(`data-${userId}`)
      return {
        statusCode: 200,
        body: JSON.stringify(data || { people: [], clients: [] }),
      }
    }

    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body)
      await store.set(`data-${userId}`, data)
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
