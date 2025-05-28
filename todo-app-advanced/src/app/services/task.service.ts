import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = []; // Array local de tareas
  private tasksSubject = new BehaviorSubject<Task[]>([]); // "Canal de transmisión"
  private nextId = 1; // Contador para IDs únicos

  constructor() { 
    this.loadFromStorage();
  }

  // Observable para que los componentes se suscriban, osea que no se pueden editar
  getTasks(): Observable<Task[]> {
    return this.tasksSubject.asObservable();
  }

  // CRUD Operations
  addTask(taskData: Omit<Task, 'id' | 'createdAt'>): void {
    const newTask: Task = {
      ...taskData,  // Copia los datos que recibimos
      id: this.nextId++,  // Añade ID automático
      createdAt: new Date() // Añade fecha actual
    };
    
    this.tasks.push(newTask);  // Añade al array local
    this.updateSubject();     // ¡Transmite el cambio!
    this.saveToStorage();     // Guarda en localStorage
  }

  updateTask(id: number, updates: Partial<Task>): void {
    const index = this.tasks.findIndex(task => task.id === id); // Envía copia del array actualizado
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.updateSubject();
      this.saveToStorage();
    }
  }

  deleteTask(id: number): void {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.updateSubject();
    this.saveToStorage();
  }

  toggleComplete(id: number): void {
    const task = this.tasks.find(task => task.id === id);
    if (task) {
      task.completed = !task.completed;
      this.updateSubject();
      this.saveToStorage();
    }
  }

  // Persistencia con localStorage
  private saveToStorage(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks)); // Array → texto JSON
    localStorage.setItem('nextId', this.nextId.toString());  // Número → texto
  }

  private loadFromStorage(): void {
    const savedTasks = localStorage.getItem('tasks');  // Obtiene texto
    const savedNextId = localStorage.getItem('nextId');  // Obtiene texto
    
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks); // Texto JSON → Array de objetos
      this.updateSubject();  // ¡Actualiza la "transmisión"!
    }
    
    if (savedNextId) {
      this.nextId = parseInt(savedNextId, 10);  
      // Texto → Número (base 10) se ocupa base 10 porque reconoce el 8 y 9, mientras que el octal no reconoce el 8 porque no llega a ese numero especifico
    }
  }

  private updateSubject(): void {
    this.tasksSubject.next([...this.tasks]);
  }
}
