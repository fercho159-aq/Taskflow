export interface Client {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  description: string;
  duration: number;
  isCompleted: boolean;
  clientId?: string;
  clientName?: string;
  tags: string[];
}

export interface Person {
  id: string;
  name: string;
  tasks: Task[];
}

export interface RequestData {
  people: Person[];
  clients?: Client[];
}
