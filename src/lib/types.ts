export interface Client {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  description: string;
  duration: number; // in hours
  isCompleted: boolean;
  clientId?: string;
  clientName?: string;
  tags?: ('New Client' | 'Maintenance')[];
}

export interface Person {
  id: string;
  name: string;
  tasks: Task[];
  totalHours: number;
  clientIds: string[];
}
