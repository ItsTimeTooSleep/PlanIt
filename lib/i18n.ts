import type { Language } from './types'

const zh = {
  appName: 'PlanIt',
  appTagline: '学生时间管理',

  nav: {
    home: '主页',
    calendar: '日历',
    todo: '待办',
    note: '笔记',
    customLayout: '自定义',
    stats: '统计',
    settings: '设置',
  },

  common: {
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    add: '新增',
    confirm: '确认',
    close: '关闭',
    noData: '暂无数据',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    optional: '可选',
    required: '必填',
    all: '全部',
    today: '今天',
    select: '选择',
    selectAll: '全选',
    clearSelection: '取消选择',
  },

  dashboard: {
    title: '今日看板',
    greeting: (name?: string) => name ? `你好，${name}` : '你好',
    summary: '今日概况',
    completed: '已完成',
    total: '全部',
    tasks: '任务',
    backToNow: '回到当前',
    allDayEvents: '全天事件',
    noTasksToday: '今天还没有安排，点击时间轴快速创建任务',
    noAllDayEvents: '无全天事件',
    clickToCreate: '点击创建任务',
    progressLabel: (done: number, total: number) => `已完成 ${done} / ${total} 个任务`,
  },

  task: {
    new: '新建任务',
    edit: '编辑任务',
    title: '标题',
    titlePlaceholder: '任务名称',
    date: '计划日期',
    dueDate: '截止日期',
    startTime: '开始时间',
    endTime: '结束时间',
    allDay: '全天事件',
    tags: '标签',
    tagsPlaceholder: '选择标签',
    newTag: '新建标签',
    repeatRule: '重复',
    notes: '备注',
    notesPlaceholder: '添加备注...',
    status: '状态',
    markComplete: '标记完成',
    markSkip: '标记跳过',
    markPending: '标记待处理',
    deleteConfirm: '确定要删除这个任务吗？',
    deleteConfirmTitle: '删除任务',
    deleteAllRepeat: '同时删除该任务的所有循环实例',
    noTags: '未添加标签',
    dateOrDueDateRequired: '至少需要填写计划日期或截止日期',
    advancedOptions: '高级选项',
    dueDateOffset: '截止日期偏移',
    dueDateOffsetDesc: '每个重复任务的截止日期相对于计划日期的天数',
    days: '天',
    deleteOptionOnlyThis: '仅删除此任务',
    deleteOptionAll: '删除所有实例',
    deleteOptionFuture: '仅删除未来任务',
    deleteOptionPending: '仅删除未完成任务',
  },

  status: {
    pending: '待处理',
    completed: '已完成',
    skipped: '已跳过',
  },

  repeat: {
    label: '重复规则',
    none: '不重复',
    daily: '天',
    workdays: '工作日',
    weekly: '周',
    monthly: '月',
    yearly: '年',
    custom: '自定义',
    customEvery: '每',
    customDays: '天',
    customWeeks: '周',
    customMonths: '月',
    customYears: '年',
    endDate: '结束日期',
    endDatePlaceholder: '不设置结束日期',
    weekdays: '重复日期',
    generating: '将生成重复任务',
  },
  calendarSettings: {
    title: '日历设置',
    timeRange: '显示时间范围',
    startTime: '开始时间',
    endTime: '结束时间',
    timeSnap: '时间精度',
    timeSnapDesc: '拖拽时的时间对齐精度',
    snapEnabled: '智能磁吸',
    snapEnabledDesc: '自动吸附到附近任务的边缘',
    snapThreshold: '磁吸阈值',
    snapThresholdDesc: '触发磁吸的距离（分钟）',
  },

  weekdays: {
    0: '日',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    full: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    short: ['日', '一', '二', '三', '四', '五', '六'],
  },

  calendar: {
    title: '日历',
    week: '周视图',
    month: '月视图',
    prevWeek: '上一周',
    nextWeek: '下一周',
    prevMonth: '上个月',
    nextMonth: '下个月',
    today: '今天',
    thisWeek: '本周',
    undo: '撤销',
    redo: '重做',
    selectMode: '选择模式',
    exitSelectMode: '退出选择',
    batchDelete: '批量删除',
    batchMove: '移动时间',
    batchTag: '修改标签',
    selected: (n: number) => `已选 ${n} 个`,
    noTasksWeek: '本周暂无任务',
    allDay: '全天',
    weekOf: (d: string) => `${d} 所在周`,
    smartReminder: '智能提醒',
    smartReminderTooltip: (count: number) => `明天有 ${count} 个任务即将截止但未规划`,
    noPendingDueTasks: '暂无即将截止的任务',
    dueTasksCount: (count: number) => `${count} 个任务`,
  },

  dateNote: {
    title: '日期备注',
    addNote: '添加备注',
    editNote: '编辑备注',
    placeholder: '为这一天添加备注...',
    delete: '删除备注',
    deleteConfirm: '确定要删除这条备注吗？',
    noNote: '暂无备注',
    save: '保存',
    cancel: '取消',
  },

  stats: {
    title: '统计复盘',
    timeRange: '时间范围',
    day: '今日',
    week: '本周',
    month: '本月',
    custom: '自定义',
    from: '开始',
    to: '结束',
    tagBreakdown: '时间账本',
    tagBreakdownDesc: '各标签时间占比',
    noTag: '无标签',
    efficiency: '效率趋势',
    efficiencyDesc: '每日完成任务时长（小时）',
    thisPeriod: '本期',
    prevPeriod: '上期',
    totalFocus: '专注总时长',
    completedTasks: '完成任务数',
    streak: '连续规划天数',
    hours: '小时',
    days: '天',
    tasks: '任务',
    growth: '环比',
    noData: '所选时间段暂无数据',
    noDataDesc: '完成一些任务后这里会显示统计信息',
    minutes: '分钟',
    details: '明细',
  },

  settings: {
    title: '设置',
    tags: '标签管理',
    tagsDesc: '管理任务标签和颜色',
    addTag: '新增标签',
    editTag: '编辑标签',
    deleteTag: '删除标签',
    tagName: '标签名称',
    tagNamePlaceholder: '如：学习、运动',
    tagColor: '标签颜色',
    tagDeleteConfirm: '删除标签后，使用该标签的任务将失去此标签，确认删除？',
    notifications: '通知设置',
    notificationsDesc: '任务开始和结束时发送通知',
    notificationsDescWeb: '任务开始和结束时发送浏览器通知',
    enableNotifications: '开启通知',
    notificationsGranted: '已授权',
    notificationsDenied: '已拒绝，请在系统设置中手动开启',
    notificationsDeniedWeb: '已拒绝，请在浏览器设置中手动开启',
    notificationsDeniedAlert: '通知权限被拒绝，无法启用通知功能',
    notificationsDefault: '点击开启后将请求授权',
    notificationTitle: '任务开始',
    notificationBody: '即将开始',
    notificationTitleEnd: '任务结束',
    notificationBodyEnd: '已结束',
    advanceNotification: '提前通知',
    advanceNotificationDesc: '任务开始前多久发送提醒',
    never: '永不',
    minutes: '分钟',
    showStartNotification: '任务开始通知',
    showStartNotificationDesc: '任务开始时显示通知',
    showEndNotification: '任务结束通知',
    showEndNotificationDesc: '任务结束时显示通知',
    language: '语言 / Language',
    languageDesc: '选择界面语言',
    zh: '简体中文',
    en: 'English',
    closeBehavior: '关闭行为',
    closeBehaviorDesc: '点击关闭按钮时的行为',
    closeBehaviorExit: '退出程序',
    closeBehaviorTray: '最小化到托盘',
    autoLaunch: '开机自启',
    autoLaunchDesc: '应用将在系统启动时自动运行',
    dataManagement: '数据管理',
    export: '导出数据',
    exportDesc: '将所有数据导出为 JSON 文件',
    import: '导入数据',
    importDesc: '从 JSON 文件导入数据',
    importDialogTitle: '导入数据',
    importMode: '导入模式',
    importMergeTitle: '合并',
    importMergeDesc: '保留现有数据，添加新数据',
    importOverwriteTitle: '覆盖',
    importOverwriteDesc: '替换所有现有数据',
    importConfirm: '确认导入',
    importFileVersion: '文件版本',
    importFileDate: '导出时间',
    importSuccess: '导入成功',
    importError: '导入失败，文件格式不正确',
    exportSuccess: '数据导出成功',
    importSelectItems: '选择要导入的内容',
    selectAll: '全选',
    deselectAll: '取消全选',
    importTasks: '任务',
    importTags: '标签',
    importDateNotes: '日期备注',
    importNotes: '笔记',
    importNoteLines: '笔记连线',
    importSettings: '设置',
    importPomodoro: '番茄钟状态',
    about: '关于',
    aboutDesc: 'PlanIt — 学生个人时间管理应用',
    versionPrefix: '版本 ',
    madeWith: '用心制作',
    author: '作者',
    officialWebsite: '官网',
    sponsor: '赞助支持',
    otherProjects: '更多作品',
    otherProjectsDesc: '探索更多实用工具',
    econgrapher: 'EconGrapher',
    econgrapherDesc: '一键生成专业经济学图表，AP微观/宏观经济学备考神器',
    econgrapherTag: 'AI驱动',
    gpaCalculator: 'GPA Calculator',
    gpaCalculatorDesc: '简洁高效的加权GPA计算器，支持多种评分体系',
    gpaCalculatorTag: '学生必备',
    teamsCrypt: 'TeamsCrypt',
    teamsCryptDesc: '为学生打造的 Microsoft Teams 加密聊天扩展，保护隐私安全',
    teamsCryptTag: '隐私保护',
    canvaHelper: 'CanvaHelper',
    canvaHelperDesc: 'Canva 海量素材，无需会员，付费素材也能用，创作更自由',
    canvaHelperTag: '设计神器',
    sound: '音效设置',
    soundDesc: '任务事件音效提醒',
    enableSound: '开启音效',
    playOnTaskStart: '任务开始时播放',
    playOnTaskEnd: '任务结束时播放',
    playOnTaskComplete: '任务完成时播放',
    startupPage: '启动页面',
    startupPageDesc: '应用启动时显示的页面',
    startupPageHome: '主页',
    startupPageCalendar: '日历',
    startupPageTodo: '待办',
    startupPageNote: '笔记',
    startupPageStats: '统计',
    startupPageSettings: '设置',
    checkUpdate: '检查更新',
    updateAvailable: '发现新版本',
    updateLatest: '已是最新版本',
    updateError: '检查更新失败',
    updateDownloading: '正在下载更新...',
    updateInstalled: '更新完成，即将重启应用',
    updateChecking: '正在检查更新...',
    updateNetworkError: '网络错误，请检查网络连接',
    updateTimeoutError: '请求超时，请重试',
  },
  update: {
    updateAvailable: '发现新版本',
    updateDesc: '有新版本可用，是否现在更新？',
    updateNow: '立即更新',
    remindLater: '稍后',
    skipThisVersion: '此版本不再提醒',
    downloading: '下载中...',
  },

  batch: {
    title: '批量操作',
    delete: '删除所选',
    deleteConfirm: (n: number) => `确定要删除所选的 ${n} 个任务吗？`,
    move: '移动到',
    moveDate: '目标日期',
  },

  pomodoro: {
    title: '番茄时钟',
    start: '开始',
    pause: '暂停',
    resume: '继续',
    reset: '重置',
    stop: '停止',
    work: '专注时间',
    shortBreak: '短休息',
    longBreak: '长休息',
    startPomodoro: '开始番茄时钟',
    session: '番茄',
    sessions: '番茄',
    completed: '已完成',
    of: '/',
    nextPhase: '下一阶段',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    workDuration: '专注时长（分钟）',
    shortBreakDuration: '短休息时长（分钟）',
    longBreakDuration: '长休息时长（分钟）',
    workSessionsBeforeLongBreak: '长休息前专注次数',
    autoStartBreaks: '自动开始休息',
    autoStartWork: '自动开始专注',
    currentTask: '当前任务',
    noActiveTask: '暂无进行中的任务',
    focusNow: '正在专注',
    skipBreaks: '跳过休息时间',
    settingsDesc: '专注时间设置',
  },

  todo: {
    title: '待办事项',
    subtitle: '管理所有任务',
    viewMode: {
      label: '视图模式',
      byDate: '按计划日期',
      byDueDate: '按截止日期',
    },
    timeFilter: {
      label: '时间范围',
      all: '全部',
      today: '今天',
      week: '本周',
      month: '本月',
      overdue: '已逾期',
      upcoming: '即将到来',
    },
    statusFilter: {
      label: '任务状态',
      all: '全部状态',
      pending: '待处理',
      completed: '已完成',
      skipped: '已跳过',
    },
    tagFilter: {
      label: '按标签筛选',
      all: '全部标签',
    },
    sortBy: {
      label: '排序方式',
      date: '按日期',
      time: '按时间',
      title: '按标题',
      status: '按状态',
    },
    groupBy: {
      label: '分组方式',
      none: '不分组',
      date: '按日期',
      status: '按状态',
      tag: '按标签',
    },
    allDayEvents: '全天事件',
    scheduledTasks: '已计划任务',
    noTasks: '暂无任务',
    noTasksDesc: '创建一个新任务开始你的规划',
    addTask: '新建任务',
    completedCount: (done: number, total: number) => `已完成 ${done} / ${total}`,
  },

  note: {
    title: '笔记',
    subtitle: '便利贴式笔记管理',
    newNote: '新建笔记',
    editNote: '编辑笔记',
    deleteNote: '删除笔记',
    deleteConfirm: '确定要删除这条笔记吗？',
    markComplete: '标记完成',
    markActive: '标记未完成',
    titlePlaceholder: '笔记标题',
    contentPlaceholder: '开始写笔记...',
    noNotes: '暂无笔记',
    noNotesDesc: '创建一个新笔记开始记录你的想法',
    colors: {
      yellow: '黄色',
      pink: '粉色',
      blue: '蓝色',
      green: '绿色',
      purple: '紫色',
      orange: '橙色',
    },
    toolbar: {
      bold: '粗体',
      italic: '斜体',
      underline: '下划线',
      strikethrough: '删除线',
      fontSize: '字号',
      textColor: '文字颜色',
      bulletList: '无序列表',
      numberedList: '有序列表',
      alignLeft: '左对齐',
      alignCenter: '居中',
      alignRight: '右对齐',
    },
    prevDay: '前一天',
    nextDay: '后一天',
    today: '今天',
    completed: '已完成',
    active: '进行中',
    line: {
      editLine: '编辑连线',
      deleteLine: '删除连线',
      deleteLineConfirm: '确定要删除这条连线吗？',
      lineType: '连线类型',
      lineColor: '连线颜色',
      straight: '直线',
      arrow: '箭头',
      viewConnections: '查看连接',
      noConnections: '暂无连接',
    },
  },

  tray: {
    show: '显示主窗口',
    hide: '隐藏到托盘',
    addTask: '添加任务',
    pomodoro: '番茄钟',
    startFocus: '开始专注',
    stopFocus: '停止专注',
    shortBreak: '休息5分钟',
    longBreak: '休息15分钟',
    focusMode: '聚焦模式',
    enterFocusMode: '进入聚焦模式',
    exitFocusMode: '退出聚焦模式',
    settings: '设置',
    checkUpdate: '检查更新',
    visitWebsite: '访问官网',
    contactUs: '联系我们',
    quit: '退出',
    tooltip: 'PlanIt - 专注效率',
  },
} as const

const en = {
  appName: 'PlanIt',
  appTagline: 'Student Time Manager',

  nav: {
    home: 'Home',
    calendar: 'Calendar',
    todo: 'To Do',
    note: 'Notes',
    customLayout: 'Custom',
    stats: 'Stats',
    settings: 'Settings',
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    close: 'Close',
    noData: 'No data',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    optional: 'optional',
    required: 'required',
    all: 'All',
    today: 'Today',
    select: 'Select',
    selectAll: 'Select All',
    clearSelection: 'Clear Selection',
  },

  dashboard: {
    title: "Today's Board",
    greeting: (name?: string) => name ? `Hello, ${name}` : 'Hello',
    summary: "Today's Summary",
    completed: 'Done',
    total: 'Total',
    tasks: 'tasks',
    backToNow: 'Back to Now',
    allDayEvents: 'All-Day Events',
    noTasksToday: 'No tasks today. Click on the timeline to create one.',
    noAllDayEvents: 'No all-day events',
    clickToCreate: 'Click to create task',
    progressLabel: (done: number, total: number) => `${done} / ${total} tasks completed`,
  },

  task: {
    new: 'New Task',
    edit: 'Edit Task',
    title: 'Title',
    titlePlaceholder: 'Task name',
    date: 'Plan Date',
    dueDate: 'Due Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    allDay: 'All-day event',
    tags: 'Tags',
    tagsPlaceholder: 'Select tags',
    newTag: 'New Tag',
    repeatRule: 'Repeat',
    notes: 'Notes',
    notesPlaceholder: 'Add notes...',
    status: 'Status',
    markComplete: 'Mark Complete',
    markSkip: 'Mark Skipped',
    markPending: 'Mark Pending',
    deleteConfirm: 'Delete this task?',
    deleteConfirmTitle: 'Delete Task',
    deleteAllRepeat: 'Also delete all recurring instances of this task',
    noTags: 'No tags',
    dateOrDueDateRequired: 'At least one of Plan Date or Due Date is required',
    advancedOptions: 'Advanced Options',
    dueDateOffset: 'Due Date Offset',
    dueDateOffsetDesc: 'Number of days after plan date for due date on recurring tasks',
    days: 'days',
    deleteOptionOnlyThis: 'Only this task',
    deleteOptionAll: 'All instances',
    deleteOptionFuture: 'Future tasks only',
    deleteOptionPending: 'Pending tasks only',
  },

  status: {
    pending: 'Pending',
    completed: 'Completed',
    skipped: 'Skipped',
  },

  repeat: {
    label: 'Repeat',
    none: 'No repeat',
    daily: 'Daily',
    workdays: 'Workdays',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
    customEvery: 'Every',
    customDays: 'days',
    customWeeks: 'weeks',
    customMonths: 'months',
    customYears: 'years',
    endDate: 'End Date',
    endDatePlaceholder: 'No end date',
    weekdays: 'On days',
    generating: 'Will generate recurring tasks',
  },
  calendarSettings: {
    title: 'Calendar Settings',
    timeRange: 'Display Time Range',
    startTime: 'Start Time',
    endTime: 'End Time',
    timeSnap: 'Time Precision',
    timeSnapDesc: 'Time alignment precision when dragging',
    snapEnabled: 'Smart Snap',
    snapEnabledDesc: 'Automatically snap to nearby task edges',
    snapThreshold: 'Snap Threshold',
    snapThresholdDesc: 'Distance to trigger snap (minutes)',
  },

  weekdays: {
    0: 'Su',
    1: 'Mo',
    2: 'Tu',
    3: 'We',
    4: 'Th',
    5: 'Fr',
    6: 'Sa',
    full: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },

  calendar: {
    title: 'Calendar',
    week: 'Week',
    month: 'Month',
    prevWeek: 'Previous Week',
    nextWeek: 'Next Week',
    prevMonth: 'Previous Month',
    nextMonth: 'Next Month',
    today: 'Today',
    thisWeek: 'This Week',
    undo: 'Undo',
    redo: 'Redo',
    selectMode: 'Select',
    exitSelectMode: 'Exit Select',
    batchDelete: 'Delete Selected',
    batchMove: 'Move',
    batchTag: 'Edit Tags',
    selected: (n: number) => `${n} selected`,
    noTasksWeek: 'No tasks this week',
    allDay: 'All day',
    weekOf: (d: string) => `Week of ${d}`,
    smartReminder: 'Smart Reminder',
    smartReminderTooltip: (count: number) => `You have ${count} task${count > 1 ? 's' : ''} due tomorrow but not scheduled`,
    noPendingDueTasks: 'No pending due tasks',
    dueTasksCount: (count: number) => `${count} task${count > 1 ? 's' : ''}`,
  },

  dateNote: {
    title: 'Date Note',
    addNote: 'Add Note',
    editNote: 'Edit Note',
    placeholder: 'Add a note for this day...',
    delete: 'Delete Note',
    deleteConfirm: 'Delete this note?',
    noNote: 'No note',
    save: 'Save',
    cancel: 'Cancel',
  },

  stats: {
    title: 'Statistics',
    timeRange: 'Time Range',
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    tagBreakdown: 'Time Ledger',
    tagBreakdownDesc: 'Time by tag',
    noTag: 'No Tag',
    efficiency: 'Efficiency Trend',
    efficiencyDesc: 'Completed task hours per day',
    thisPeriod: 'This Period',
    prevPeriod: 'Last Period',
    totalFocus: 'Total Focus Time',
    completedTasks: 'Tasks Completed',
    streak: 'Planning Streak',
    hours: 'hrs',
    days: 'days',
    tasks: 'tasks',
    growth: 'vs last',
    noData: 'No data for selected period',
    noDataDesc: 'Complete some tasks to see your stats',
    minutes: 'min',
    details: 'Details',
  },

  settings: {
    title: 'Settings',
    tags: 'Tag Management',
    tagsDesc: 'Manage task tags and colors',
    addTag: 'Add Tag',
    editTag: 'Edit Tag',
    deleteTag: 'Delete Tag',
    tagName: 'Tag Name',
    tagNamePlaceholder: 'e.g. Study, Exercise',
    tagColor: 'Tag Color',
    tagDeleteConfirm: 'Tasks using this tag will lose it. Delete?',
    notifications: 'Notifications',
    notificationsDesc: 'Get notified when tasks start and end',
    notificationsDescWeb: 'Get browser notifications when tasks start and end',
    enableNotifications: 'Enable Notifications',
    notificationsGranted: 'Granted',
    notificationsDenied: 'Denied — enable in system settings',
    notificationsDeniedWeb: 'Denied — enable in browser settings',
    notificationsDeniedAlert: 'Notification permission denied. Cannot enable notifications.',
    notificationsDefault: 'Click to request permission',
    notificationTitle: 'Task Starting',
    notificationBody: 'is about to start',
    notificationTitleEnd: 'Task Ended',
    notificationBodyEnd: 'has ended',
    advanceNotification: 'Advance Notification',
    advanceNotificationDesc: 'How long before task start to send reminder',
    never: 'Never',
    minutes: 'minutes',
    showStartNotification: 'Task Start Notification',
    showStartNotificationDesc: 'Show notification when task starts',
    showEndNotification: 'Task End Notification',
    showEndNotificationDesc: 'Show notification when task ends',
    language: 'Language / 语言',
    languageDesc: 'Choose interface language',
    zh: '简体中文',
    en: 'English',
    closeBehavior: 'Close Behavior',
    closeBehaviorDesc: 'Action when clicking the close button',
    closeBehaviorExit: 'Exit Application',
    closeBehaviorTray: 'Minimize to Tray',
    autoLaunch: 'Auto-start on Boot',
    autoLaunchDesc: 'Application will automatically run on system startup',
    dataManagement: 'Data Management',
    export: 'Export Data',
    exportDesc: 'Export all data as JSON file',
    import: 'Import Data',
    importDesc: 'Import data from JSON file',
    importDialogTitle: 'Import Data',
    importMode: 'Import Mode',
    importMergeTitle: 'Merge',
    importMergeDesc: 'Keep existing data, add new data',
    importOverwriteTitle: 'Overwrite',
    importOverwriteDesc: 'Replace all existing data',
    importConfirm: 'Confirm Import',
    importFileVersion: 'File Version',
    importFileDate: 'Export Date',
    importSuccess: 'Import successful',
    importError: 'Import failed — invalid file format',
    exportSuccess: 'Data exported successfully',
    importSelectItems: 'Select items to import',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    importTasks: 'Tasks',
    importTags: 'Tags',
    importDateNotes: 'Date Notes',
    importNotes: 'Notes',
    importNoteLines: 'Note Lines',
    importSettings: 'Settings',
    importPomodoro: 'Pomodoro State',
    about: 'About',
    aboutDesc: 'PlanIt — Student Time Management App',
    versionPrefix: 'Version ',
    madeWith: 'Made with care',
    author: 'Author',
    officialWebsite: 'Website',
    sponsor: 'Sponsor',
    otherProjects: 'More Projects',
    otherProjectsDesc: 'Explore more useful tools',
    econgrapher: 'EconGrapher',
    econgrapherDesc: 'Generate professional economics charts instantly — ace AP Micro/Macro',
    econgrapherTag: 'AI-Powered',
    gpaCalculator: 'GPA Calculator',
    gpaCalculatorDesc: 'Clean & efficient weighted GPA calculator with multiple grading scales',
    gpaCalculatorTag: 'Student Essential',
    teamsCrypt: 'TeamsCrypt',
    teamsCryptDesc: 'Encrypted chat extension for Microsoft Teams, designed for students',
    teamsCryptTag: 'Privacy',
    canvaHelper: 'CanvaHelper',
    canvaHelperDesc: 'Unlock premium Canva assets for free — design without limits',
    canvaHelperTag: 'Design Tool',
    sound: 'Sound Settings',
    soundDesc: 'Sound effects for task events',
    enableSound: 'Enable Sound',
    playOnTaskStart: 'Play when task starts',
    playOnTaskEnd: 'Play when task ends',
    playOnTaskComplete: 'Play when task completes',
    startupPage: 'Startup Page',
    startupPageDesc: 'Page to display when app starts',
    startupPageHome: 'Home',
    startupPageCalendar: 'Calendar',
    startupPageTodo: 'To Do',
    startupPageNote: 'Notes',
    startupPageStats: 'Stats',
    startupPageSettings: 'Settings',
    checkUpdate: 'Check for Updates',
    updateAvailable: 'New version available',
    updateLatest: 'You are up to date',
    updateError: 'Failed to check for updates',
    updateDownloading: 'Downloading update...',
    updateInstalled: 'Update complete, restarting app...',
    updateChecking: 'Checking for updates...',
    updateNetworkError: 'Network error. Please check your connection.',
    updateTimeoutError: 'Request timed out. Please try again.',
  },
  update: {
    updateAvailable: 'New version available',
    updateDesc: 'A new version is available. Would you like to update now?',
    updateNow: 'Update Now',
    remindLater: 'Remind Me Later',
    skipThisVersion: 'Skip this version',
    downloading: 'Downloading...',
  },

  batch: {
    title: 'Bulk Actions',
    delete: 'Delete Selected',
    deleteConfirm: (n: number) => `Delete ${n} selected task${n > 1 ? 's' : ''}?`,
    move: 'Move to',
    moveDate: 'Target Date',
  },

  pomodoro: {
    title: 'Pomodoro Timer',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    stop: 'Stop',
    work: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    startPomodoro: 'Start Pomodoro',
    session: 'Pomodoro',
    sessions: 'Pomodoros',
    completed: 'Completed',
    of: '/',
    nextPhase: 'Next Phase',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    workDuration: 'Focus duration (min)',
    shortBreakDuration: 'Short break (min)',
    longBreakDuration: 'Long break (min)',
    workSessionsBeforeLongBreak: 'Pomodoros before long break',
    autoStartBreaks: 'Auto-start breaks',
    autoStartWork: 'Auto-start focus',
    currentTask: 'Current Task',
    noActiveTask: 'No active task',
    focusNow: 'Focusing now',
    skipBreaks: 'Skip breaks',
    settingsDesc: 'Focus time settings',
  },

  todo: {
    title: 'To Do List',
    subtitle: 'Manage all your tasks',
    viewMode: {
      label: 'View Mode',
      byDate: 'By Plan Date',
      byDueDate: 'By Due Date',
    },
    timeFilter: {
      label: 'Time Range',
      all: 'All',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      overdue: 'Overdue',
      upcoming: 'Upcoming',
    },
    statusFilter: {
      label: 'Task Status',
      all: 'All Status',
      pending: 'Pending',
      completed: 'Completed',
      skipped: 'Skipped',
    },
    tagFilter: {
      label: 'Filter by Tag',
      all: 'All Tags',
    },
    sortBy: {
      label: 'Sort By',
      date: 'By Date',
      time: 'By Time',
      title: 'By Title',
      status: 'By Status',
    },
    groupBy: {
      label: 'Group By',
      none: 'No Grouping',
      date: 'By Date',
      status: 'By Status',
      tag: 'By Tag',
    },
    allDayEvents: 'All-Day Events',
    scheduledTasks: 'Scheduled Tasks',
    noTasks: 'No tasks yet',
    noTasksDesc: 'Create a new task to get started',
    addTask: 'Add Task',
    completedCount: (done: number, total: number) => `${done} / ${total} completed`,
  },

  note: {
    title: 'Notes',
    subtitle: 'Sticky note management',
    newNote: 'New Note',
    editNote: 'Edit Note',
    deleteNote: 'Delete Note',
    deleteConfirm: 'Delete this note?',
    markComplete: 'Mark Complete',
    markActive: 'Mark Active',
    titlePlaceholder: 'Note title',
    contentPlaceholder: 'Start writing...',
    noNotes: 'No notes yet',
    noNotesDesc: 'Create a new note to start capturing your thoughts',
    colors: {
      yellow: 'Yellow',
      pink: 'Pink',
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      orange: 'Orange',
    },
    toolbar: {
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      strikethrough: 'Strikethrough',
      fontSize: 'Font Size',
      textColor: 'Text Color',
      bulletList: 'Bullet List',
      numberedList: 'Numbered List',
      alignLeft: 'Align Left',
      alignCenter: 'Align Center',
      alignRight: 'Align Right',
    },
    prevDay: 'Previous Day',
    nextDay: 'Next Day',
    today: 'Today',
    completed: 'Completed',
    active: 'Active',
    line: {
      editLine: 'Edit Line',
      deleteLine: 'Delete Line',
      deleteLineConfirm: 'Delete this line?',
      lineType: 'Line Type',
      lineColor: 'Line Color',
      straight: 'Straight',
      arrow: 'Arrow',
      viewConnections: 'View Connections',
      noConnections: 'No connections',
    },
  },

  tray: {
    show: 'Show Main Window',
    hide: 'Hide to Tray',
    addTask: 'Add Task',
    pomodoro: 'Pomodoro',
    startFocus: 'Start Focus',
    stopFocus: 'Stop Focus',
    shortBreak: '5 Min Break',
    longBreak: '15 Min Break',
    focusMode: 'Focus Mode',
    enterFocusMode: 'Enter Focus Mode',
    exitFocusMode: 'Exit Focus Mode',
    settings: 'Settings',
    checkUpdate: 'Check for Updates',
    visitWebsite: 'Visit Website',
    contactUs: 'Contact Us',
    quit: 'Quit',
    tooltip: 'PlanIt - Focus & Productivity',
  },
} as const

export type Translations = {
  readonly appName: string
  readonly appTagline: string
  readonly nav: {
    readonly home: string
    readonly calendar: string
    readonly todo: string
    readonly note: string
    readonly customLayout: string
    readonly stats: string
    readonly settings: string
  }
  readonly common: {
    readonly save: string
    readonly cancel: string
    readonly delete: string
    readonly edit: string
    readonly add: string
    readonly confirm: string
    readonly close: string
    readonly noData: string
    readonly loading: string
    readonly success: string
    readonly error: string
    readonly optional: string
    readonly required: string
    readonly all: string
    readonly today: string
    readonly select: string
    readonly selectAll: string
    readonly clearSelection: string
  }
  readonly dashboard: {
    readonly title: string
    readonly greeting: (name?: string) => string
    readonly summary: string
    readonly completed: string
    readonly total: string
    readonly tasks: string
    readonly backToNow: string
    readonly allDayEvents: string
    readonly noTasksToday: string
    readonly noAllDayEvents: string
    readonly clickToCreate: string
    readonly progressLabel: (done: number, total: number) => string
  }
  readonly task: {
    readonly new: string
    readonly edit: string
    readonly title: string
    readonly titlePlaceholder: string
    readonly date: string
    readonly dueDate: string
    readonly startTime: string
    readonly endTime: string
    readonly allDay: string
    readonly tags: string
    readonly tagsPlaceholder: string
    readonly newTag: string
    readonly repeatRule: string
    readonly notes: string
    readonly notesPlaceholder: string
    readonly status: string
    readonly markComplete: string
    readonly markSkip: string
    readonly markPending: string
    readonly deleteConfirm: string
    readonly deleteConfirmTitle: string
    readonly deleteAllRepeat: string
    readonly noTags: string
    readonly dateOrDueDateRequired: string
    readonly advancedOptions: string
    readonly dueDateOffset: string
    readonly dueDateOffsetDesc: string
    readonly days: string
    readonly deleteOptionOnlyThis: string
    readonly deleteOptionAll: string
    readonly deleteOptionFuture: string
    readonly deleteOptionPending: string
  }
  readonly status: {
    readonly pending: string
    readonly completed: string
    readonly skipped: string
  }
  readonly repeat: {
    readonly label: string
    readonly none: string
    readonly daily: string
    readonly workdays: string
    readonly weekly: string
    readonly monthly: string
    readonly yearly: string
    readonly custom: string
    readonly customEvery: string
    readonly customDays: string
    readonly customWeeks: string
    readonly customMonths: string
    readonly customYears: string
    readonly endDate: string
    readonly endDatePlaceholder: string
    readonly weekdays: string
    readonly generating: string
  }
  readonly calendarSettings: {
    readonly title: string
    readonly timeRange: string
    readonly startTime: string
    readonly endTime: string
    readonly timeSnap: string
    readonly timeSnapDesc: string
    readonly snapEnabled: string
    readonly snapEnabledDesc: string
    readonly snapThreshold: string
    readonly snapThresholdDesc: string
  }
  readonly weekdays: {
    readonly 0: string
    readonly 1: string
    readonly 2: string
    readonly 3: string
    readonly 4: string
    readonly 5: string
    readonly 6: string
    readonly full: readonly string[]
    readonly short: readonly string[]
  }
  readonly calendar: {
    readonly title: string
    readonly week: string
    readonly month: string
    readonly prevWeek: string
    readonly nextWeek: string
    readonly prevMonth: string
    readonly nextMonth: string
    readonly today: string
    readonly thisWeek: string
    readonly undo: string
    readonly redo: string
    readonly selectMode: string
    readonly exitSelectMode: string
    readonly batchDelete: string
    readonly batchMove: string
    readonly batchTag: string
    readonly selected: (n: number) => string
    readonly noTasksWeek: string
    readonly allDay: string
    readonly weekOf: (d: string) => string
    readonly smartReminder: string
    readonly smartReminderTooltip: (count: number) => string
    readonly noPendingDueTasks: string
    readonly dueTasksCount: (count: number) => string
  }
  readonly dateNote: {
    readonly title: string
    readonly addNote: string
    readonly editNote: string
    readonly placeholder: string
    readonly delete: string
    readonly deleteConfirm: string
    readonly noNote: string
    readonly save: string
    readonly cancel: string
  }
  readonly stats: {
    readonly title: string
    readonly timeRange: string
    readonly day: string
    readonly week: string
    readonly month: string
    readonly custom: string
    readonly from: string
    readonly to: string
    readonly tagBreakdown: string
    readonly tagBreakdownDesc: string
    readonly noTag: string
    readonly efficiency: string
    readonly efficiencyDesc: string
    readonly thisPeriod: string
    readonly prevPeriod: string
    readonly totalFocus: string
    readonly completedTasks: string
    readonly streak: string
    readonly hours: string
    readonly days: string
    readonly tasks: string
    readonly growth: string
    readonly noData: string
    readonly noDataDesc: string
    readonly minutes: string
    readonly details: string
  }
  readonly settings: {
    readonly title: string
    readonly tags: string
    readonly tagsDesc: string
    readonly addTag: string
    readonly editTag: string
    readonly deleteTag: string
    readonly tagName: string
    readonly tagNamePlaceholder: string
    readonly tagColor: string
    readonly tagDeleteConfirm: string
    readonly notifications: string
    readonly notificationsDesc: string
    readonly notificationsDescWeb: string
    readonly enableNotifications: string
    readonly notificationsGranted: string
    readonly notificationsDenied: string
    readonly notificationsDeniedWeb: string
    readonly notificationsDeniedAlert: string
    readonly notificationsDefault: string
    readonly notificationTitle: string
    readonly notificationBody: string
    readonly notificationTitleEnd: string
    readonly notificationBodyEnd: string
    readonly advanceNotification: string
    readonly advanceNotificationDesc: string
    readonly never: string
    readonly minutes: string
    readonly showStartNotification: string
    readonly showStartNotificationDesc: string
    readonly showEndNotification: string
    readonly showEndNotificationDesc: string
    readonly language: string
    readonly languageDesc: string
    readonly zh: string
    readonly en: string
    readonly closeBehavior: string
    readonly closeBehaviorDesc: string
    readonly closeBehaviorExit: string
    readonly closeBehaviorTray: string
    readonly autoLaunch: string
    readonly autoLaunchDesc: string
    readonly dataManagement: string
    readonly export: string
    readonly exportDesc: string
    readonly import: string
    readonly importDesc: string
    readonly importDialogTitle: string
    readonly importMode: string
    readonly importMergeTitle: string
    readonly importMergeDesc: string
    readonly importOverwriteTitle: string
    readonly importOverwriteDesc: string
    readonly importConfirm: string
    readonly importFileVersion: string
    readonly importFileDate: string
    readonly importSuccess: string
    readonly importError: string
    readonly exportSuccess: string
    readonly importSelectItems: string
    readonly selectAll: string
    readonly deselectAll: string
    readonly importTasks: string
    readonly importTags: string
    readonly importDateNotes: string
    readonly importNotes: string
    readonly importNoteLines: string
    readonly importSettings: string
    readonly importPomodoro: string
    readonly about: string
    readonly aboutDesc: string
    readonly versionPrefix: string
    readonly madeWith: string
    readonly author: string
    readonly officialWebsite: string
    readonly sponsor: string
    readonly otherProjects: string
    readonly otherProjectsDesc: string
    readonly econgrapher: string
    readonly econgrapherDesc: string
    readonly econgrapherTag: string
    readonly gpaCalculator: string
    readonly gpaCalculatorDesc: string
    readonly gpaCalculatorTag: string
    readonly teamsCrypt: string
    readonly teamsCryptDesc: string
    readonly teamsCryptTag: string
    readonly canvaHelper: string
    readonly canvaHelperDesc: string
    readonly canvaHelperTag: string
    readonly sound: string
    readonly soundDesc: string
    readonly enableSound: string
    readonly playOnTaskStart: string
    readonly playOnTaskEnd: string
    readonly playOnTaskComplete: string
    readonly startupPage: string
    readonly startupPageDesc: string
    readonly startupPageHome: string
    readonly startupPageCalendar: string
    readonly startupPageTodo: string
    readonly startupPageNote: string
    readonly startupPageStats: string
    readonly startupPageSettings: string
    readonly checkUpdate: string
    readonly updateAvailable: string
    readonly updateLatest: string
    readonly updateError: string
    readonly updateDownloading: string
    readonly updateInstalled: string
    readonly updateChecking: string
    readonly updateNetworkError: string
    readonly updateTimeoutError: string
  }
  readonly update: {
    readonly updateAvailable: string
    readonly updateDesc: string
    readonly updateNow: string
    readonly remindLater: string
    readonly skipThisVersion: string
    readonly downloading: string
  }
  readonly batch: {
    readonly title: string
    readonly delete: string
    readonly deleteConfirm: (n: number) => string
    readonly move: string
    readonly moveDate: string
  }
  readonly pomodoro: {
    readonly title: string
    readonly start: string
    readonly pause: string
    readonly resume: string
    readonly reset: string
    readonly stop: string
    readonly work: string
    readonly shortBreak: string
    readonly longBreak: string
    readonly startPomodoro: string
    readonly session: string
    readonly sessions: string
    readonly completed: string
    readonly of: string
    readonly nextPhase: string
    readonly fullscreen: string
    readonly exitFullscreen: string
    readonly workDuration: string
    readonly shortBreakDuration: string
    readonly longBreakDuration: string
    readonly workSessionsBeforeLongBreak: string
    readonly autoStartBreaks: string
    readonly autoStartWork: string
    readonly currentTask: string
    readonly noActiveTask: string
    readonly focusNow: string
    readonly skipBreaks: string
    readonly settingsDesc: string
  }
  readonly todo: {
    readonly title: string
    readonly subtitle: string
    readonly viewMode: {
      readonly label: string
      readonly byDate: string
      readonly byDueDate: string
    }
    readonly timeFilter: {
      readonly label: string
      readonly all: string
      readonly today: string
      readonly week: string
      readonly month: string
      readonly overdue: string
      readonly upcoming: string
    }
    readonly statusFilter: {
      readonly label: string
      readonly all: string
      readonly pending: string
      readonly completed: string
      readonly skipped: string
    }
    readonly tagFilter: {
      readonly label: string
      readonly all: string
    }
    readonly sortBy: {
      readonly label: string
      readonly date: string
      readonly time: string
      readonly title: string
      readonly status: string
    }
    readonly groupBy: {
      readonly label: string
      readonly none: string
      readonly date: string
      readonly status: string
      readonly tag: string
    }
    readonly allDayEvents: string
    readonly scheduledTasks: string
    readonly noTasks: string
    readonly noTasksDesc: string
    readonly addTask: string
    readonly completedCount: (done: number, total: number) => string
  }
  readonly note: {
    readonly title: string
    readonly subtitle: string
    readonly newNote: string
    readonly editNote: string
    readonly deleteNote: string
    readonly deleteConfirm: string
    readonly markComplete: string
    readonly markActive: string
    readonly titlePlaceholder: string
    readonly contentPlaceholder: string
    readonly noNotes: string
    readonly noNotesDesc: string
    readonly colors: {
      readonly yellow: string
      readonly pink: string
      readonly blue: string
      readonly green: string
      readonly purple: string
      readonly orange: string
    }
    readonly toolbar: {
      readonly bold: string
      readonly italic: string
      readonly underline: string
      readonly strikethrough: string
      readonly fontSize: string
      readonly textColor: string
      readonly bulletList: string
      readonly numberedList: string
      readonly alignLeft: string
      readonly alignCenter: string
      readonly alignRight: string
    }
    readonly prevDay: string
    readonly nextDay: string
    readonly today: string
    readonly completed: string
    readonly active: string
    readonly line: {
      readonly editLine: string
      readonly deleteLine: string
      readonly deleteLineConfirm: string
      readonly lineType: string
      readonly lineColor: string
      readonly straight: string
      readonly arrow: string
      readonly viewConnections: string
      readonly noConnections: string
    }
  }
  readonly tray: {
    readonly show: string
    readonly hide: string
    readonly addTask: string
    readonly pomodoro: string
    readonly startFocus: string
    readonly stopFocus: string
    readonly shortBreak: string
    readonly longBreak: string
    readonly focusMode: string
    readonly enterFocusMode: string
    readonly exitFocusMode: string
    readonly settings: string
    readonly checkUpdate: string
    readonly visitWebsite: string
    readonly contactUs: string
    readonly quit: string
    readonly tooltip: string
  }
}

export const translations: Record<Language, Translations> = { zh, en }

export function useTranslations(lang: Language): Translations {
  return translations[lang] ?? translations.zh
}
