import { Handler } from '@netlify/functions'
import { neon } from '@netlify/neon'
import type { Client, Task, Person, RequestData } from './types'

// Inicializar la conexión a la base de datos
const sql = neon(process.env.NETLIFY_DATABASE_URL)

// Definir la función para inicializar tablas
async function initializeTables(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      description TEXT,
      duration INTEGER,
      is_completed BOOLEAN DEFAULT FALSE,
      client_id TEXT,
      client_name TEXT,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      assigned_to TEXT REFERENCES users(id)
    )
  `;
  
  console.log('Tables initialized successfully');
}

export const handler: Handler = async (event) => {
  try {
    // Initialize tables if they don't exist
    try {
      await initializeTables(sql);
    } catch (error) {
      console.error('Error initializing tables:', error);
    }

    const userId = event.headers['x-user-id'];
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'x-user-id header is required' })
      };
    }

    if (event.httpMethod === 'GET') {
      try {
        // Obtener usuarios específicos
        const users = await sql`
          WITH known_users AS (
            SELECT * FROM (VALUES 
              ('1', 'Omar'),
              ('2', 'Fernando'),
              ('3', 'Julio')
            ) AS u(id, name)
          )
          SELECT 
            u.id,
            u.name,
            COALESCE(
              (SELECT array_agg(DISTINCT c.id)
               FROM clients c
               WHERE c.user_id = u.id), 
              '{}'::text[]
            ) as client_ids
          FROM known_users u
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
        const people = users.map((person: Record<string, any>) => {
          const personTasks = tasks.filter((t: Record<string, any>) => t.assigned_to === person.id).map((t: Record<string, any>) => ({
            id: t.id,
            description: t.description,
            duration: Number(t.duration) || 0,
            isCompleted: t.is_completed,
            clientId: t.client_id,
            clientName: t.client_name,
            tags: Array.isArray(t.tags) ? t.tags : []
          }));
          
          const clientIds = Array.isArray(person.client_ids) ? person.client_ids : [];
          const totalHours = personTasks.reduce((sum, t) => sum + (!t.isCompleted ? Number(t.duration) || 0 : 0), 0);
          
          return {
            id: person.id,
            name: person.name,
            clientIds,
            tasks: personTasks,
            totalHours
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
        const data = JSON.parse(typeof event.body === 'string' ? event.body : event.body) as RequestData;
        console.log('Received data:', JSON.stringify(data, null, 2));

        // Validate data structure
        if (!data.people || !Array.isArray(data.people)) {
          throw new Error('Invalid data structure: people array is required');
        }

        // Verificar que el usuario es válido
        if (!['1', '2', '3'].includes(userId)) {
          throw new Error('Invalid user ID. Must be 1, 2, or 3.');
        }

        // Asegurarse de que el usuario existe con el nombre correcto
        const userName = {
          '1': 'Omar',
          '2': 'Fernando',
          '3': 'Julio'
        }[userId];

        await sql`
          INSERT INTO users (id, name)
          VALUES (${userId}, ${userName})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name;
        `;
        
        // Begin transaction
        await sql`BEGIN`;
        
        try {
          // Actualizar clientes
          const clientsToUpdate = (data.clients || []).filter((c: Client) => c && c.id && c.name);
          if (clientsToUpdate.length > 0) {
            console.log('Updating clients:', clientsToUpdate.length);
            for (const client of clientsToUpdate) {
              await sql`
                INSERT INTO clients (id, name, user_id)
                VALUES (${client.id}, ${client.name}, ${userId})
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name;
              `;
            }
          }

          // Actualizar tareas
          if (data.people && data.people.length > 0) {
            console.log('Processing tasks for people:', data.people.length);
            
            // Borrar solo las tareas del usuario que vamos a actualizar
            const personIds = data.people.map((p: Person) => p.id).filter(Boolean);
            if (personIds.length > 0) {
              await sql`
                DELETE FROM tasks 
                WHERE user_id = ${userId}
                AND assigned_to = ANY(${personIds});
              `;
            }

            // Insertar las nuevas tareas
            for (const person of data.people) {
              if (person && person.id && Array.isArray(person.tasks)) {
                const validTasks = person.tasks.filter((t: Task) => t && t.id && t.description);
                for (const task of validTasks) {
                  await sql`
                    INSERT INTO tasks (
                      id, description, duration, is_completed, 
                      client_id, client_name, tags, user_id, assigned_to
                    )
                    VALUES (
                      ${task.id}, 
                      ${task.description || ''}, 
                      ${Math.max(0, Number(task.duration) || 0)}, 
                      ${Boolean(task.isCompleted)}, 
                      ${task.clientId || null}, 
                      ${task.clientName || null}, 
                      ${Array.isArray(task.tags) ? task.tags : []}, 
                      ${userId}, 
                      ${person.id}
                    );
                  `;
                }
              }
            }
          }

          // Commit transaction
          await sql`COMMIT`;
          console.log('Transaction committed successfully');
        } catch (error) {
          // Rollback transaction on error
          await sql`ROLLBACK`;
          console.error('Transaction rolled back due to error:', error);
          throw error;
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
