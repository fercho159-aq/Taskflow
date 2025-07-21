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

    if (event.httpMethod === 'GET') {
      try {
        // Obtener usuarios con sus datos
        const users = await sql`
          SELECT u.id, u.name, u.client_ids 
          FROM users u
          ORDER BY u.id;
        `

        const tasks = await sql`
          SELECT t.*
          FROM tasks t
          ORDER BY t.created_at DESC;
        `

        const clients = await sql`
          SELECT c.*
          FROM clients c
          ORDER BY c.name;
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
        const data = JSON.parse(typeof event.body === 'string' ? event.body : event.body);
        console.log('Received data:', data);

        // Primero, asegurarse de que el usuario existe
        await sql`
          INSERT INTO users (id)
          VALUES (${userId})
          ON CONFLICT (id) DO NOTHING;
        `;
        
        // Actualizar clientes
        if (data.clients?.length > 0) {
          console.log('Updating clients:', data.clients);
          for (const client of data.clients) {
            try {
              await sql`
                INSERT INTO clients (id, name, user_id)
                VALUES (${client.id}, ${client.name}, ${userId})
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  user_id = EXCLUDED.user_id;
              `;
              console.log('Client updated:', client.id);
            } catch (error) {
              console.error('Error updating client:', client.id, error);
              throw error;
            }
          }
        }

        // Actualizar tareas
        if (data.people) {
          console.log('Processing tasks for people:', data.people);
          
          // Primero, borrar todas las tareas existentes del usuario
          await sql`
            DELETE FROM tasks 
            WHERE user_id = ${userId};
          `;

          for (const person of data.people) {
            if (Array.isArray(person.tasks)) {
              for (const task of person.tasks) {
                try {
                  console.log('Creating task:', task);
                  await sql`
                    INSERT INTO tasks (
                      id, description, duration, is_completed, 
                      client_id, client_name, tags, user_id, assigned_to
                    )
                    VALUES (
                      ${task.id}, 
                      ${task.description}, 
                      ${Number(task.duration) || 0}, 
                      ${Boolean(task.isCompleted)}, 
                      ${task.clientId || null}, 
                      ${task.clientName || null}, 
                      ${Array.isArray(task.tags) ? task.tags : []}, 
                      ${userId}, 
                      ${person.id}
                    );
                  `;
                  console.log('Task created:', task.id);
                } catch (error) {
                  console.error('Error creating task:', task.id, error);
                  throw error;
                }
              }
            }
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
