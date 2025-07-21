import { Handler } from '@netlify/functions'
import { neon } from '@netlify/neon'

// Inicializar la conexión a la base de datos
const sql = neon(process.env.NETLIFY_DATABASE_URL)

// Asegurarnos de que las tablas existen
async function initializeTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        description TEXT,
        duration INTEGER,
        is_completed BOOLEAN DEFAULT FALSE,
        client_id TEXT,
        client_name TEXT,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('Tables initialized successfully')
  } catch (error) {
    console.error('Error initializing tables:', error)
  }
}

// Inicializar tablas al arrancar la función
initializeTables()

export const handler: Handler = async (event) => {
  try {
    const userId = event.headers['x-user-id'] || 'default-user'

    // Asegurarse de que el usuario existe
    await sql`
      INSERT INTO users (id)
      VALUES (${userId})
      ON CONFLICT (id) DO NOTHING;
    `

    if (event.httpMethod === 'GET') {
      try {
        // Obtener usuarios, tareas y clientes
        const users = await sql`
          SELECT * FROM users
          ORDER BY id;
        `

        const tasks = await sql`
          SELECT * FROM tasks
          WHERE user_id = ${userId}
          ORDER BY created_at DESC;
        `

        const clients = await sql`
          SELECT * FROM clients
          WHERE user_id = ${userId}
          ORDER BY name;
        `

        // Transformar los datos al formato esperado por el frontend
        const people = users.map(person => {
          const personTasks = tasks.filter(t => t.assigned_to === person.id).map(t => ({
            id: t.id,
            description: t.description,
            duration: t.duration,
            isCompleted: t.is_completed,
            clientId: t.client_id,
            clientName: t.client_name,
            tags: t.tags || []
          }))
          
          return {
            id: person.id,
            name: person.name,
            clientIds: person.client_ids || [],
            tasks: personTasks,
            totalHours: personTasks.reduce((sum, t) => sum + (t.isCompleted ? 0 : t.duration), 0)
          }
        })

        return {
          statusCode: 200,
          body: JSON.stringify({ 
            people,
            clients
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        return {
          statusCode: 200,
          body: JSON.stringify({ people: [], clients: [] })
        }
      }
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const data = JSON.parse(typeof event.body === 'string' ? event.body : event.body)
        
        // Actualizar clientes
        if (data.clients?.length > 0) {
          await sql`
            WITH new_clients AS (
              SELECT * FROM jsonb_to_recordset(${JSON.stringify(data.clients)})
              AS x(id text, name text)
            )
            INSERT INTO clients (id, name, user_id)
            SELECT id, name, ${userId}
            FROM new_clients
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name;
          `
        }

        // Actualizar tareas
        if (data.people) {
          const allTasks = data.people.flatMap(p => p.tasks.map(t => ({
            ...t,
            assigned_to: p.id
          })))

          if (allTasks.length > 0) {
            await sql`
              WITH new_tasks AS (
                SELECT * FROM jsonb_to_recordset(${JSON.stringify(allTasks)})
                AS x(id text, description text, duration integer, is_completed boolean,
                    client_id text, client_name text, tags text[], assigned_to text)
              )
              INSERT INTO tasks (id, description, duration, is_completed, client_id,
                              client_name, tags, user_id, assigned_to)
              SELECT id, description, duration, is_completed, client_id,
                     client_name, tags, ${userId}, assigned_to
              FROM new_tasks
              ON CONFLICT (id) DO UPDATE SET
                is_completed = EXCLUDED.is_completed,
                description = EXCLUDED.description,
                duration = EXCLUDED.duration,
                client_id = EXCLUDED.client_id,
                client_name = EXCLUDED.client_name,
                tags = EXCLUDED.tags,
                assigned_to = EXCLUDED.assigned_to;
            `
          }
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            message: 'Data saved successfully'
          })
        }
      } catch (error) {
        console.error('Error saving data:', error)
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
