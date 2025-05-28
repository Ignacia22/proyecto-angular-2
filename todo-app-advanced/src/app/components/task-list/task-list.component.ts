import { Component } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-list',
  imports: [TaskService],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  taskForm: FormGroup;
  searchTerm: string = '';
  filterStatus: 'all' | 'pending' | 'completed' = 'all';
  isEditing: boolean = false;
  editingTaskId: number | null = null;

  private destroy$ = new Subject<void>();  // "Interruptor" para cancelar
  // pérdidas de memoria (memory leaks)

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario reactivo
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit(): void {
    // Suscribirse a los cambios de tareas
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$)) // "Escucha hasta que destroy$ se active"
      .subscribe(tasks => {
        this.tasks = tasks;
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();  // "¡Cancela todas las suscripciones!"
    this.destroy$.complete(); // Limpia el Subject
  }

  // CRUD Operations
  onSubmit(): void {
    if (this.taskForm.valid) {
      const taskData = this.taskForm.value;
      
      if (this.isEditing && this.editingTaskId) {
        // Actualizar tarea existente
        this.taskService.updateTask(this.editingTaskId, taskData);
        this.cancelEdit();
      } else {
        // Crear nueva tarea
        this.taskService.addTask({
          ...taskData,
          completed: false
        });
      }
      
      this.taskForm.reset();
      this.taskForm.patchValue({ priority: 'medium' });
    }
  }

  editTask(task: Task): void {
    this.isEditing = true;
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      priority: task.priority
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingTaskId = null;
    this.taskForm.reset();
    this.taskForm.patchValue({ priority: 'medium' });
  }

  deleteTask(id: number): void {
    if (confirm('¿Estás segura de eliminar esta tarea?')) {
      this.taskService.deleteTask(id);
    }
  }

  toggleComplete(id: number): void {
    this.taskService.toggleComplete(id);
  }

  // Filtros y búsqueda
  onSearchChange(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  onFilterChange(status: 'all' | 'pending' | 'completed'): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.tasks];

    // Filtrar por estado
    if (this.filterStatus === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (this.filterStatus === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(this.searchTerm) ||
        task.description?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredTasks = filtered;
  }

  // Getters para el template
  get title() { return this.taskForm.get('title'); }
  get description() { return this.taskForm.get('description'); }
  get priority() { return this.taskForm.get('priority'); }
}


// destroy$: Lo creamos nosotros como "interruptor"
// takeUntil(this.destroy$): "Escucha hasta que se active el interruptor"
// ngOnDestroy: Angular lo llama cuando destruye el componente
// this.destroy$.next(): Activamos el interruptor = se cancelan todas las suscripciones
