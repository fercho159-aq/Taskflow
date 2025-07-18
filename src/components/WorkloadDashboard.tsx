import type { Person } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface WorkloadDashboardProps {
  people: Person[];
}

export function WorkloadDashboard({ people }: WorkloadDashboardProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-4">Workload Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{person.name}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {person.totalHours.toFixed(1)} hours
              </div>
              <p className="text-xs text-muted-foreground">
                {person.tasks.length} task{person.tasks.length !== 1 ? 's' : ''} assigned
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
