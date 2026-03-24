import type { Task } from './types'

export type HistoryActionType = 
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'delete_tasks'
  | 'batch_update'

export interface HistoryAction {
  type: HistoryActionType
  timestamp: number
  data: HistoryActionData
}

export type HistoryActionData = 
  | CreateTaskData
  | UpdateTaskData
  | DeleteTaskData
  | DeleteTasksData
  | BatchUpdateData

export interface CreateTaskData {
  task: Task
}

export interface UpdateTaskData {
  taskId: string
  previousState: Partial<Task>
  newState: Partial<Task>
}

export interface DeleteTaskData {
  task: Task
}

export interface DeleteTasksData {
  tasks: Task[]
}

export interface BatchUpdateData {
  updates: Array<{
    taskId: string
    previousState: Partial<Task>
    newState: Partial<Task>
  }>
}

const MAX_HISTORY_SIZE = 50

export class HistoryManager {
  private undoStack: HistoryAction[] = []
  private redoStack: HistoryAction[] = []

  /**
   * 添加一个新的历史动作
   * @param action - 历史动作
   */
  push(action: HistoryAction): void {
    this.undoStack.push(action)
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  /**
   * 撤销最近的操作
   * @returns 被撤销的动作，如果没有可撤销的动作则返回null
   */
  undo(): HistoryAction | null {
    const action = this.undoStack.pop()
    if (action) {
      this.redoStack.push(action)
    }
    return action ?? null
  }

  /**
   * 重做最近撤销的操作
   * @returns 被重做的动作，如果没有可重做的动作则返回null
   */
  redo(): HistoryAction | null {
    const action = this.redoStack.pop()
    if (action) {
      this.undoStack.push(action)
    }
    return action ?? null
  }

  /**
   * 检查是否可以撤销
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 检查是否可以重做
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * 清空所有历史记录
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * 获取撤销栈大小
   * @returns 撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * 获取重做栈大小
   * @returns 重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }
}

export const historyManager = new HistoryManager()
