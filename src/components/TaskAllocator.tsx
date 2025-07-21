"use client";

import { useState, useEffect } from 'react';
import type { Person, Task, Client } from '@/lib/types';
import { TaskEntryForm } from './TaskEntryForm';
import { WorkloadDashboard } from './WorkloadDashboard';
import { TaskColumns } from './TaskColumns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import initialPendingTasks from '@/data/pending-tasks.json';
import initialResolvedTasks from '@/data/resolved-tasks.json';
import initialClients from '@/data/clients.json';
import { ClientEntryForm } from './ClientEntryForm';

const initialPeopleData: Omit<Person, 'tasks' | 'totalHours'>[] = [
  { id: '1', name: 'Omar', clientIds: ['client-1', 'client-2'] },
  { id: '2', name: 'Fernando', clientIds: ['client-3'] },
  { id: '3', name: 'Julio', clientIds: ['client-1', 'client-4'] },
];

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error al leer la clave de localStorage "${key}":`, error);
    return defaultValue;
  }
};

export function TaskAllocator() {
  const [people, setPeople] = useState<Person[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize state from backend
    fetch('/.netlify/functions/tasks', {
      headers: {
        'x-user-id': 'default-user'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.people && data.clients) {
        setPeople(data.people);
        setClients(data.clients);
      } else {
        // First time load, initialize from JSON
        const allTasks: Task[] = [...initialPendingTasks, ...initialResolvedTasks];
        const clientMap = new Map(initialClients.map(c => [c.id, c.name]));

        let currentPeople = initialPeopleData.map(p => ({ ...p, tasks: [] as Task[], totalHours: 0 }));

        allTasks.forEach((task, index) => {
          const personIndex = index % currentPeople.length;
          const taskWithClientName = {
            ...task,
            clientName: task.clientId ? clientMap.get(task.clientId) : undefined,
          };
          currentPeople[personIndex].tasks.push(taskWithClientName);
          if (!task.isCompleted) {
            currentPeople[personIndex].totalHours += task.duration;
          }
        });
        setPeople(currentPeople);
        setClients(initialClients);
      }
      setIsInitialized(true);
    })
    .catch(error => {
      console.error('Error loading from backend:', error);
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    // Persist state to backend whenever it changes
    if (isInitialized) {
      try {
        fetch('/.netlify/functions/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'default-user'
          },
          body: JSON.stringify({ people, clients })
        })
        .then(response => response.json())
        .catch(error => console.error('Error saving to backend:', error));
      } catch (error) {
        console.error('Error saving state to backend:', error);
      }
    }
  }, [people, clients, isInitialized]);


  const handleAddClient = (clientName: string) => {
    const newClient: Client = {
      id: `client-${crypto.randomUUID()}`,
      name: clientName,
    };
    setClients(currentClients => [...currentClients, newClient]);
  };

  const handleAddTask = (taskDescription: string, taskDuration: number, tags: ('New Client' | 'Maintenance')[] , clientId?: string, personId?: string) => {
    const getTargetPerson = () => {
        if (personId) {
            return people.find(p => p.id === personId);
        }
        return [...people].sort((a, b) => a.totalHours - b.totalHours)[0];
    };

    const targetPerson = getTargetPerson();
    if (!targetPerson) {
        console.error("No se pudo encontrar a la persona para asignar la tarea.");
        return;
    }

    const clientName = clientId ? clients.find(c => c.id === clientId)?.name : undefined;

    const newTask: Task = {
      id: crypto.randomUUID(),
      description: taskDescription,
      duration: taskDuration,
      isCompleted: false,
      clientId,
      clientName,
      tags,
    };

    setPeople((currentPeople) =>
      currentPeople.map((person) => {
        if (person.id === targetPerson.id) {
          const updatedTasks = [...person.tasks, newTask];
          return {
            ...person,
            tasks: updatedTasks,
            totalHours: person.totalHours + taskDuration,
          };
        }
        return person;
      })
    );
  };
  
  const handleToggleTask = (personId: string, taskId: string) => {
    setPeople(currentPeople =>
      currentPeople.map(person => {
        if (person.id === personId) {
          let hoursChange = 0;
          const updatedTasks = person.tasks.map(task => {
            if (task.id === taskId) {
              hoursChange = task.isCompleted ? task.duration : -task.duration;
              return { ...task, isCompleted: !task.isCompleted };
            }
            return task;
          });

          return {
            ...person,
            tasks: updatedTasks,
            totalHours: person.totalHours + hoursChange,
          };
        }
        return person;
      })
    );
  };
    
  if (!isInitialized) {
      return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <p>Cargando...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold font-headline" style={{ color: 'hsl(var(--primary))' }}>TaskFlow Allocator</h1>
          <p className="text-muted-foreground mt-2">Asigna tareas de forma inteligente según la carga de trabajo.</p>
        </header>

        <main className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Añadir un Nuevo Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientEntryForm onAddClient={handleAddClient} />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Añadir una Nueva Tarea</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskEntryForm onAddTask={handleAddTask} clients={clients} people={people} />
              </CardContent>
            </Card>
          </div>

          <WorkloadDashboard people={people} />

          <TaskColumns people={people} onToggleTask={handleToggleTask} />
        </main>
      </div>
    </div>
  );
}
