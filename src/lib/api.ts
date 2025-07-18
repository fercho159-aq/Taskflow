import { Person, Client } from './types'

const API_URL = '/.netlify/functions/tasks'
const USER_ID = 'default-user' // You can implement proper user authentication later

interface TaskflowData {
  people: Person[]
  clients: Client[]
}

export async function saveData(data: TaskflowData): Promise<void> {
  try {
    console.log('Enviando datos a la API:', data);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response from server:', errorData);
      throw new Error(`Failed to save data: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Respuesta del servidor:', result);
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

export async function loadData(): Promise<TaskflowData | null> {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'x-user-id': USER_ID,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to load data')
    }
    
    return response.json()
  } catch (error) {
    console.error('Error loading data:', error)
    return null
  }
}
