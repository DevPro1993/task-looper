import { Injectable } from '@angular/core';
import { Task } from 'src/models/task';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {


  constructor() { }

  private url: string = 'https://task-looper-default-rtdb.firebaseio.com/';

  async getAllTasks() {
    return await this.getDocument('tasks');
  }


  async getTaskById(id: string): Promise<Task> {
    return <Task>(await this.getDocument(`tasks/${id}`));
  }
  
  async markAsComplete(task: Task) {
    const nextTaskId = await this.findNextTaskId(task);
    await this.putDocument('currentTaskId', nextTaskId);
    if (task.currentCount < task.maxRepeatCount) {
      task.currentCount++;
      await this.patchDocument(`tasks/${task.id}`, task);
    } else {
      let prevTask = await this.findPrevTask(task);
      if (!prevTask) {
        await this.putDocument('head', nextTaskId);
      } else {
        if (!task.nextTaskId) {
          prevTask.nextTaskId = null;
        } else {
          prevTask.nextTaskId = task.nextTaskId;
        }
        await this.putDocument(`tasks/${task.id}`, prevTask);
      }
      await this.deleteDocument(`tasks/${task.id}`);
    }
  }

  async addNewTask(task: Task) {
    let head = await this.getDocument('head');
    task.nextTaskId = head ?? null;
    await this.putDocument('head', <string>task.id)
    await this.putDocument(`tasks/${task.id}`, task);
  }


  async getCurrentTask() {
    let currentTaskId = await this.getDocument('currentTaskId');
    if (!currentTaskId) {
      return this.getTaskById(await this.getDocument('head'));
    } 
    return await this.getTaskById(currentTaskId);
  }


  private async findPrevTask(task: Task): Promise<Task | null> {
    let headTask = await this.getTaskById(await this.getDocument('head'));
    if (headTask.id === task.id) return null;
    let currTask = headTask;
    while (headTask.nextTaskId !== task.id) {
      currTask = await this.getTaskById(currTask.nextTaskId as string);
    }
    return currTask;
  }

  private async findNextTaskId(task: Task): Promise<string | null> {
    if (!task.nextTaskId && await this.getDocument('head') === task.id) return null;
    return task.nextTaskId ?? await this.getDocument('head');
  }


  private async getDocument(name: string) {
    const result = await fetch(this.url + name + '.json');
    return await result.json();
  }

  private putDocument(name: string, data: any) {
    return fetch(this.url + name + '.json', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  private patchDocument(name: string, data: any) {
    return fetch(this.url + name + '.json', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  private deleteDocument(name: string) {
    return fetch(this.url + name + '.json', {
      method: 'DELETE'
    });
  }
}
