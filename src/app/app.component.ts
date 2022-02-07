import { Component, OnInit } from '@angular/core';
import { Task } from 'src/models/task';
import { guid } from "dyna-guid";
import { RepositoryService } from 'src/services/repository.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // add new task
  addNewTaskActive: boolean = false;
  taskName: string;
  maxRepeatCount: number;
  currentTask: Task;
  isLoading: boolean = false;

  constructor(private db: RepositoryService) {
   
  }

  ngOnInit() {
    this.setCurrentTask();
  }

  async setCurrentTask() {
    this.isLoading = true;
    this.currentTask = (await this.db.getCurrentTask()) as Task;
    this.isLoading = false;
  }

  async addNewTask() {
    if (!this.taskName || !this.maxRepeatCount || this.maxRepeatCount < 1) return;
    const task = new Task(guid(1), this.taskName, 0, this.maxRepeatCount, null)
    await this.db.addNewTask(task)
    this.taskName = '';
    this.maxRepeatCount = 1;
    this.addNewTaskActive = false;
    await this.setCurrentTask()
  }


  async markAsComplete() {
    await this.db.markAsComplete(this.currentTask);
    await this.setCurrentTask();
  }

}
