import { Handler } from '@netlify/functions'
import { neon } from '@netlify/neon'
import initialPendingTasks from '../../src/data/pending-tasks.json'
import initialResolvedTasks from '../../src/data/resolved-tasks.json'
import initialClients from '../../src/data/clients.json'
import { calculateDueDate } from './utils'

const sql = neon(process.env.NETLIFY_DATABASE_URL)

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Eliminar tablas existentes
    await sql`DROP TABLE IF EXISTS tasks CASCADE`
    await sql`DROP TABLE IF EXISTS clients CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Crear tabla de usuarios
    await sql`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `

    // Crear tabla de clientes
    await sql`
      CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear tabla de tareas
    await sql`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        description TEXT,
        duration NUMERIC,
        is_completed BOOLEAN DEFAULT FALSE,
        client_id TEXT,
        client_name TEXT,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP WITH TIME ZONE,
        assigned_to TEXT REFERENCES users(id)
      )
    `

    // Insertar usuarios iniciales
    const initialUsers = [
      { id: '1', name: 'Omar' },
      { id: '2', name: 'Fernando' },
      { id: '3', name: 'Julio' }
    ]

    // Insertar usuarios
    for (const user of initialUsers) {
      await sql`
        INSERT INTO users (id, name)
        VALUES (${user.id}, ${user.name})
      `
    }

    // Insertar clientes
    for (const client of initialClients) {
      await sql`
        INSERT INTO clients (id, name, user_id)
        VALUES (${client.id}, ${client.name}, ${'default-user'})
      `
    }

    // Insertar tareas
    for (let i = 0; i < initialPendingTasks.length; i++) {
      const task = initialPendingTasks[i];
      const personIndex = i % 3;
      const assignedTo = (personIndex + 1).toString();
      const client = initialClients.find(c => c.id === task.clientId);
      const dueDate = calculateDueDate(task.duration);

      await sql`
        INSERT INTO tasks (
          id, description, duration, is_completed,
          client_id, client_name, tags, assigned_to, user_id, due_date
        )
        VALUES (
          ${task.id},
          ${task.description},
          ${task.duration},
          ${task.isCompleted},
          ${task.clientId},
          ${client?.name},
          ${[]},
          ${assignedTo},
          ${'default-user'},
          ${dueDate}
        )
      `
    }

    // Insertar tareas resueltas
    for (let i = 0; i < initialResolvedTasks.length; i++) {
      const task = initialResolvedTasks[i];
      const personIndex = i % 3;
      const assignedTo = (personIndex + 1).toString();
      const client = initialClients.find(c => c.id === task.clientId);
      const dueDate = calculateDueDate(task.duration);

      await sql`
        INSERT INTO tasks (
          id, description, duration, is_completed,
          client_id, client_name, tags, assigned_to, user_id, due_date
        )
        VALUES (
          ${task.id},
          ${task.description},
          ${task.duration},
          ${task.isCompleted},
          ${task.clientId},
          ${client?.name},
          ${[]},
          ${assignedTo},
          ${'default-user'},
          ${dueDate}
        )
      `
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database initialized successfully',
        usersCount: initialUsers.length,
        clientsCount: initialClients.length,
        tasksCount: initialPendingTasks.length + initialResolvedTasks.length
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
