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

const initialPeople: Omit<Person, 'tasks' | 'totalHours'>[] = [
  { id: '1', name: 'Omar', clientIds: ['client-1', 'client-2'] },
  { id: '2', name: 'Fernando', clientIds: ['client-3'] },
  { id: '3', name: 'Julio', clientIds: ['client-1', 'client-4'] },
];

export function TaskAllocator() {
  const [people, setPeople] = useState<Person[]>(initialPeople.map(p => ({...p, tasks: [], totalHours: 0})));
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client to initialize the state
    if (!isInitialized) {
      const allTasks: Task[] = [...initialPendingTasks, ...initialResolvedTasks];
      const clientMap = new Map(clients.map(c => [c.id, c.name]));

      let currentPeople = initialPeople.map(p => ({ ...p, tasks: [], totalHours: 0 }));

      allTasks.forEach((task, index) => {
        // Simple round-robin assignment for initial load
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
      setIsInitialized(true);
    }
  }, [isInitialized, clients]);

  const handleAddClient = (clientName: string) => {
    const newClient: Client = {
      id: `client-${crypto.randomUUID()}`,
      name: clientName,
    };
    setClients(currentClients => [...currentClients, newClient]);
  };

  const handleAddTask = (taskDescription: string, taskDuration: number, tags: ('New Client' | 'Maintenance')[] , clientId?: string) => {
    // Find person with the least workload (only considering active tasks)
    const personWithLeastWorkload = [...people].sort(
      (a, b) => a.totalHours - b.totalHours
    )[0];

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
        if (person.id === personWithLeastWorkload.id) {
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

  const personWithLeastWorkload = people.length > 0 ? [...people].sort(
      (a, b) => a.totalHours - b.totalHours
    )[0] : null;

  const availableClientsForNewTask = personWithLeastWorkload 
    ? clients.filter(client => personWithLeastWorkload.clientIds.includes(client.id))
    : clients;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold font-headline" style={{ color: 'hsl(var(--primary))' }}>TaskFlow Allocator</h1>
          <p className="text-muted-foreground mt-2">Intelligently assign tasks based on workload.</p>
        </header>

        <main className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add a New Client</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientEntryForm onAddClient={handleAddClient} />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add a New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskEntryForm onAddTask={handleAddTask} clients={availableClientsForNewTask} />
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
