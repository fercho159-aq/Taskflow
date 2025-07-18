import { Handler } from '@netlify/functions'
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join('/tmp', 'taskflow-data')

// Asegurarse de que el directorio existe
try {
  fs.mkdirSync(DATA_DIR, { recursive: true })
} catch (error) {
  console.error('Error creating data directory:', error)
}

export const handler: Handler = async (event) => {
  try {
    const userId = event.headers['x-user-id'] || 'default-user'
    const dataPath = path.join(DATA_DIR, `${userId}.json`)

    if (event.httpMethod === 'GET') {
      try {
        if (!fs.existsSync(dataPath)) {
          return {
            statusCode: 200,
            body: JSON.stringify({ people: [], clients: [] })
          }
        }

        const data = fs.readFileSync(dataPath, 'utf-8')
        return {
          statusCode: 200,
          body: data
        }
      } catch (error) {
        console.error('Error reading data:', error)
        return {
          statusCode: 200,
          body: JSON.stringify({ people: [], clients: [] })
        }
      }
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const jsonData = typeof event.body === 'string' ? event.body : JSON.stringify(event.body)
        
        // Log para debugging
        console.log('Writing data:', {
          userId,
          path: dataPath,
          dataSize: jsonData.length
        })

        fs.writeFileSync(dataPath, jsonData)
        
        console.log('Data saved successfully')
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            message: 'Data saved successfully'
          })
        }
      } catch (error) {
        console.error('Error saving data:', {
          error: error instanceof Error ? error.message : String(error),
          path: dataPath
        })
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Error saving data',
            message: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
