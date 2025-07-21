import { Handler } from '@netlify/functions'
import { neon } from '@netlify/neon'
import initialPendingTasks from '../../src/data/pending-tasks.json'
import initialResolvedTasks from '../../src/data/resolved-tasks.json'
import initialClients from '../../src/data/clients.json'

const sql = neon(process.env.NETLIFY_DATABASE_URL)

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Crear tablas
    await sql`
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS clients;
      DROP TABLE IF EXISTS users;

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client_ids TEXT[]
      );

      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        duration INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        client_id TEXT,
        client_name TEXT,
        tags TEXT[],
        assigned_to TEXT,
        user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Insertar usuarios iniciales
    const initialUsers = [
      { id: '1', name: 'Omar', clientIds: ['client-1', 'client-2'] },
      { id: '2', name: 'Fernando', clientIds: ['client-3'] },
      { id: '3', name: 'Julio', clientIds: ['client-1', 'client-4'] }
    ]

    await sql`
      INSERT INTO users ${sql(initialUsers, 'id', 'name', 'clientIds')}
    `

    // Insertar clientes
    await sql`
      INSERT INTO clients ${sql(initialClients.map(c => ({
        ...c,
        user_id: 'default-user'
      })), 'id', 'name', 'user_id')}
    `

    // Combinar todas las tareas
    const allTasks = [
      ...initialPendingTasks,
      ...initialResolvedTasks
    ].map((task, index) => {
      const personIndex = index % 3 // Distribuir entre los 3 usuarios
      const userId = (personIndex + 1).toString()
      const client = initialClients.find(c => c.id === task.clientId)
      
      return {
        ...task,
        is_completed: task.isCompleted,
        client_name: client?.name,
        assigned_to: userId,
        user_id: 'default-user',
        tags: task.tags || []
      }
    })

    // Insertar tareas
    if (allTasks.length > 0) {
      await sql`
        INSERT INTO tasks ${sql(allTasks, 
          'id', 
          'description', 
          'duration', 
          'is_completed', 
          'client_id', 
          'client_name',
          'tags',
          'assigned_to',
          'user_id'
        )}
      `
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database initialized successfully',
        usersCount: initialUsers.length,
        clientsCount: initialClients.length,
        tasksCount: allTasks.length
      })
    }
  } catch (error) {
    console.error('Error initializing database:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to initialize database',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
