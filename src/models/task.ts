export class Task {
    constructor(public id: string | null,public taskName: string, public currentCount: number, public maxRepeatCount: number, public nextTaskId: string | null) {}
}