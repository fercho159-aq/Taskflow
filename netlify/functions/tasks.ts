import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    return new Error(String(maybeError))
  }
}

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
        console.log('Attempting to fetch data for user:', userId)
        const result = await store.get(`data-${userId}`)
        
        if (!result) {
          console.log('No data found for user:', userId)
          return {
            statusCode: 200,
            body: JSON.stringify({ people: [], clients: [] }),
          }
        }

        const resultText = result.toString()
        console.log('Data retrieved, length:', resultText.length)
        
        const data = JSON.parse(resultText)
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        }
      } catch (maybeError) {
        const error = toErrorWithMessage(maybeError)
        console.error('Error fetching data:', {
          error: error.message,
          userId
        })
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            people: [], 
            clients: [],
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
          }),
        }
      }
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        // Parse and validate the incoming data
        const jsonData = typeof event.body === 'string' ? event.body : JSON.stringify(event.body)
        
        // Log the data being processed
        console.log('Processing data:', {
          userId,
          dataType: typeof jsonData,
          dataLength: jsonData.length
        })

        // Store as a text string instead of Blob
        await store.set(`data-${userId}`, jsonData)
        
        console.log('Data saved successfully for user:', userId)
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            message: 'Data saved successfully'
          }),
        }
      } catch (maybeError) {
        const error = toErrorWithMessage(maybeError)
        console.error('Error saving data:', {
          error: error.message,
          userId,
          stack: error.stack
        })
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Error saving data',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }),
        }
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
