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
    const nextTask = await this.findNextTask(task);
    const prevTask = await this.findPrevTask(task);
    if (task.currentCount < task.maxRepeatCount) {
      task.currentCount++;
      await this.patchDocument(`tasks/${task.id}`, task);
    } else {
      console.log(nextTask);
      await this.deleteDocument(`tasks/${task.id}`);
      if (!prevTask) {
        await this.postDocument('head', nextTask?.id ?? null)
      } else {
        prevTask.nextTaskId = task.nextTaskId;
        await this.patchDocument(`tasks/${task.id}`, task)
      }
    }
    await this.postDocument('currentTaskId', nextTask?.id ?? await this.getDocument('head'))
  }

  async addNewTask(task: Task) {
    let head = await this.getDocument('head');
    task.nextTaskId = head ?? null;
    await this.postDocument('head', <string>task.id)
    await this.postDocument(`tasks/${task.id}`, task);
  }


  async getCurrentTask() {
    let currentTaskId = await this.getDocument('currentTaskId');
    if (!currentTaskId) {
      return this.getTaskById(await this.getDocument('head'));
    } 
    return await this.getTaskById(currentTaskId);
  }


  private async findPrevTask(task: Task): Promise<Task | null> {
    debugger;
    let headTask = await this.getTaskById(await this.getDocument('head'));
    if (headTask.id === task.id) return null;
    let currTask = headTask;
    while (currTask.nextTaskId !== task.id) {
      currTask = await this.getTaskById(currTask.nextTaskId as string);
    }
    return currTask;
  }

  private async findNextTask(task: Task): Promise<Task | null> {
    if (!task.nextTaskId) return null;
    return await this.getTaskById(task.nextTaskId);
  }


  private async getDocument(name: string) {
    const result = await fetch(this.url + name + '.json');
    return await result.json();
  }

  private postDocument(name: string, data: any) {
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
