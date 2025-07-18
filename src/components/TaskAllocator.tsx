"use client";

import { useState, useEffect } from 'react';
import type { Person, Task } from '@/lib/types';
import { TaskEntryForm } from './TaskEntryForm';
import { WorkloadDashboard } from './WorkloadDashboard';
import { TaskColumns } from './TaskColumns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import initialPendingTasks from '@/data/pending-tasks.json';
import initialResolvedTasks from '@/data/resolved-tasks.json';

const initialPeople: Person[] = [
  { id: '1', name: 'Omar', tasks: [], totalHours: 0 },
  { id: '2', name: 'Fernando', tasks: [], totalHours: 0 },
  { id: '3', name: 'Julio', tasks: [], totalHours: 0 },
];

export function TaskAllocator() {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client to initialize the state
    if (!isInitialized) {
      const allTasks = [...initialPendingTasks, ...initialResolvedTasks];
      let currentPeople = [...initialPeople].map(p => ({ ...p, tasks: [], totalHours: 0 }));

      allTasks.forEach((task, index) => {
        // Simple round-robin assignment for initial load
        const personIndex = index % currentPeople.length;
        currentPeople[personIndex].tasks.push({ ...task });
        if (!task.isCompleted) {
          currentPeople[personIndex].totalHours += task.duration;
        }
      });
      
      setPeople(currentPeople);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleAddTask = (taskDescription: string, taskDuration: number) => {
    // Find person with the least workload (only considering active tasks)
    const personWithLeastWorkload = [...people].sort(
      (a, b) => a.totalHours - b.totalHours
    )[0];

    const newTask: Task = {
      id: crypto.randomUUID(),
      description: taskDescription,
      duration: taskDuration,
      isCompleted: false,
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold font-headline" style={{ color: 'hsl(var(--primary))' }}>TaskFlow Allocator</h1>
          <p className="text-muted-foreground mt-2">Intelligently assign tasks based on workload.</p>
        </header>

        <main className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Add a New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskEntryForm onAddTask={handleAddTask} />
            </CardContent>
          </Card>

          <WorkloadDashboard people={people} />

          <TaskColumns people={people} onToggleTask={handleToggleTask} />
        </main>
      </div>
    </div>
  );
}
