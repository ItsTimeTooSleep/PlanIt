import type { Task } from './types'
import { timeToMinutes } from './task-utils'

/**
 * 任务布局信息接口
 * @property task - 任务对象
 * @property top - 顶部位置（像素）
 * @property height - 高度（像素）
 * @property left - 左侧偏移百分比
 * @property width - 宽度百分比
 * @property columnIndex - 所在列索引
 * @property totalColumns - 该组总列数
 */
export interface TaskLayoutInfo {
  task: Task
  top: number
  height: number
  left: number
  width: number
  columnIndex: number
  totalColumns: number
}

/**
 * 检测两个任务是否时间重叠
 * @param start1 - 第一个任务开始时间（分钟）
 * @param end1 - 第一个任务结束时间（分钟）
 * @param start2 - 第二个任务开始时间（分钟）
 * @param end2 - 第二个任务结束时间（分钟）
 * @returns 是否重叠
 */
export function tasksOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * 计算任务布局，处理重叠任务分列显示
 * 使用贪心算法为重叠任务分配列，确保互不遮挡
 * @param tasks - 任务列表
 * @param hourHeight - 每小时高度（像素）
 * @param dayStartMinutes - 一天开始的分钟数（默认0）
 * @returns 每个任务的布局信息数组
 */
export function calculateTaskLayouts(
  tasks: Task[],
  hourHeight: number,
  dayStartMinutes: number = 0
): TaskLayoutInfo[] {
  if (tasks.length === 0) return []

  const tasksWithTime = tasks
    .filter(t => t.startTime && t.endTime)
    .map(task => ({
      task,
      startMin: timeToMinutes(task.startTime!),
      endMin: timeToMinutes(task.endTime!),
    }))
    .sort((a, b) => a.startMin - b.startMin)

  if (tasksWithTime.length === 0) return []

  const columnEnds: number[] = []
  const assignments: { task: Task; startMin: number; endMin: number; column: number }[] = []

  for (const item of tasksWithTime) {
    let assignedColumn = -1
    for (let col = 0; col < columnEnds.length; col++) {
      if (columnEnds[col] <= item.startMin) {
        assignedColumn = col
        break
      }
    }
    if (assignedColumn === -1) {
      assignedColumn = columnEnds.length
      columnEnds.push(item.endMin)
    } else {
      columnEnds[assignedColumn] = item.endMin
    }
    assignments.push({
      task: item.task,
      startMin: item.startMin,
      endMin: item.endMin,
      column: assignedColumn,
    })
  }

  const totalColumns = columnEnds.length
  const columnWidth = 100 / totalColumns
  const gap = 2

  return assignments.map(item => {
    const top = ((item.startMin - dayStartMinutes) / 60) * hourHeight
    const height = ((item.endMin - item.startMin) / 60) * hourHeight
    const left = item.column * columnWidth
    const width = columnWidth - gap

    return {
      task: item.task,
      top,
      height,
      left: Math.max(0, left),
      width: Math.max(0, width),
      columnIndex: item.column,
      totalColumns,
    }
  })
}

/**
 * 计算任务布局（带分组优化版本）
 * 将连续重叠的任务分为一组，组内独立计算列分配
 * 这样可以让不重叠的任务组各自占据全宽
 * @param tasks - 任务列表
 * @param hourHeight - 每小时高度（像素）
 * @param dayStartMinutes - 一天开始的分钟数（默认0）
 * @returns 每个任务的布局信息数组
 */
export function calculateTaskLayoutsGrouped(
  tasks: Task[],
  hourHeight: number,
  dayStartMinutes: number = 0
): TaskLayoutInfo[] {
  if (tasks.length === 0) return []

  const tasksWithTime = tasks
    .filter(t => t.startTime && t.endTime)
    .map(task => ({
      task,
      startMin: timeToMinutes(task.startTime!),
      endMin: timeToMinutes(task.endTime!),
    }))
    .sort((a, b) => a.startMin - b.startMin)

  if (tasksWithTime.length === 0) return []

  const groups: { startMin: number; endMin: number; items: typeof tasksWithTime }[] = []

  for (const item of tasksWithTime) {
    let foundGroup = false
    for (const group of groups) {
      if (tasksOverlap(group.startMin, group.endMin, item.startMin, item.endMin)) {
        group.items.push(item)
        group.startMin = Math.min(group.startMin, item.startMin)
        group.endMin = Math.max(group.endMin, item.endMin)
        foundGroup = true
        break
      }
    }
    if (!foundGroup) {
      groups.push({
        startMin: item.startMin,
        endMin: item.endMin,
        items: [item],
      })
    }
  }

  const results: TaskLayoutInfo[] = []

  for (const group of groups) {
    const columnEnds: number[] = []
    const assignments: { task: Task; startMin: number; endMin: number; column: number }[] = []

    for (const item of group.items) {
      let assignedColumn = -1
      for (let col = 0; col < columnEnds.length; col++) {
        if (columnEnds[col] <= item.startMin) {
          assignedColumn = col
          break
        }
      }
      if (assignedColumn === -1) {
        assignedColumn = columnEnds.length
        columnEnds.push(item.endMin)
      } else {
        columnEnds[assignedColumn] = item.endMin
      }
      assignments.push({
        task: item.task,
        startMin: item.startMin,
        endMin: item.endMin,
        column: assignedColumn,
      })
    }

    const totalColumns = columnEnds.length
    const columnWidth = 100 / totalColumns
    const gap = 2

    for (const item of assignments) {
      const top = ((item.startMin - dayStartMinutes) / 60) * hourHeight
      const height = ((item.endMin - item.startMin) / 60) * hourHeight
      const left = item.column * columnWidth
      const width = columnWidth - gap

      results.push({
        task: item.task,
        top,
        height,
        left: Math.max(0, left),
        width: Math.max(0, width),
        columnIndex: item.column,
        totalColumns,
      })
    }
  }

  return results
}
