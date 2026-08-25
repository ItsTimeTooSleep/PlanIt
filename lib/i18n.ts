import type { Language } from "./types";

const zh = {
	appName: "PlanIt",
	appTagline: "学生时间管理",

	nav: {
		home: "主页",
		calendar: "日历",
		todo: "待办",
		note: "笔记",
		customLayout: "自定义",
		stats: "统计",
		settings: "设置",
	},

	common: {
		save: "保存",
		cancel: "取消",
		delete: "删除",
		edit: "编辑",
		add: "新增",
		confirm: "确认",
		close: "关闭",
		minimize: "最小化",
		maximize: "最大化",
		restore: "还原",
		noData: "暂无数据",
		loading: "加载中...",
		success: "操作成功",
		error: "操作失败",
		optional: "可选",
		required: "必填",
		all: "全部",
		today: "今天",
		tomorrow: "明天",
		yesterday: "昨天",
		select: "选择",
		selectAll: "全选",
		clearSelection: "取消选择",
		skip: "跳过",
		reset: "重置",
		result: "结果",
	},

	dashboard: {
		title: "今日看板",
		greeting: (name?: string) => (name ? `你好，${name}` : "你好"),
		summary: "今日概况",
		completed: "已完成",
		total: "全部",
		tasks: "任务",
		backToNow: "回到当前",
		allDayEvents: "全天事件",
		noTasksToday: "今天还没有安排，点击时间轴快速创建任务",
		noAllDayEvents: "无全天事件",
		clickToCreate: "点击创建任务",
		progressLabel: (done: number, total: number) =>
			`已完成 ${done} / ${total} 个任务`,
	},

	task: {
		new: "新建任务",
		edit: "编辑任务",
		title: "标题",
		titlePlaceholder: "任务名称",
		date: "计划日期",
		dueDate: "截止日期",
		startTime: "开始时间",
		endTime: "结束时间",
		allDay: "全天事件",
		tags: "标签",
		tagsPlaceholder: "选择标签",
		newTag: "新建标签",
		repeatRule: "重复",
		notes: "备注",
		notesPlaceholder: "添加备注...",
		status: "状态",
		markComplete: "标记完成",
		markSkip: "标记跳过",
		markPending: "标记待处理",
		deleteConfirm: "确定要删除这个任务吗？",
		deleteConfirmTitle: "删除任务",
		deleteOptions: "删除选项",
		deleteAllRepeat: "同时删除该任务的所有循环实例",
		noTags: "未添加标签",
		dateOrDueDateRequired: "至少需要填写计划日期或截止日期",
		advancedOptions: "高级选项",
		dueDateOffset: "截止日期偏移",
		dueDateOffsetDesc: "每个重复任务的截止日期相对于计划日期的天数",
		days: "天",
		deleteOptionOnlyThis: "仅删除此任务",
		deleteOptionAll: "删除所有实例",
		deleteOptionFuture: "仅删除未来任务",
		deleteOptionPending: "仅删除未完成任务",
		minutesLeft: "分钟剩余",
		unscheduled: "未计划",
		untagged: "未标签",
		multiStep: "多步骤",
		stepTitle: "步骤标题",
		addStep: "添加步骤",
		deleteStep: "删除步骤",
		viewFutureTasks: "查看未来任务",
		today: "今天",
		tomorrow: "明天",
		notesSyncTitle: "备注同步",
		notesSyncConfirm: "此任务是重复任务,是否将备注修改同步到其他实例？",
		notesSyncOptions: "同步选项",
		notesSyncOnlyThis: "仅修改此任务",
		notesSyncAll: "应用到全部",
		notesSyncFuture: "应用到以后(不包含之前)",
		notesSyncPending: "仅应用到未完成任务",
		historySuggestTitle: "历史任务",
		historySuggestTabHint: "确认选中",
		historySuggestCount: (n: number) => `出现过 ${n} 次`,
	},

	status: {
		pending: "待处理",
		completed: "已完成",
		skipped: "已跳过",
	},

	repeat: {
		label: "重复规则",
		none: "不重复",
		daily: "天",
		workdays: "工作日",
		weekly: "周",
		monthly: "月",
		yearly: "年",
		custom: "自定义",
		customEvery: "每",
		customDays: "天",
		customWeeks: "周",
		customMonths: "月",
		customYears: "年",
		endDate: "结束日期",
		endDatePlaceholder: "不设置结束日期",
		weekdays: "重复日期",
		generating: "将生成重复任务",
	},
	calendarSettings: {
		title: "日历设置",
		timeRange: "显示时间范围",
		startTime: "开始时间",
		endTime: "结束时间",
		timeSnap: "时间精度",
		timeSnapDesc: "拖拽时的时间对齐精度",
		snapEnabled: "智能磁吸",
		snapEnabledDesc: "自动吸附到附近任务的边缘",
		snapThreshold: "磁吸阈值",
		snapThresholdDesc: "触发磁吸的距离（分钟）",
		rowHeight: "行高",
		hourDivisions: "每小时分割",
		divisions: "段",
	},

	weekdays: {
		0: "日",
		1: "一",
		2: "二",
		3: "三",
		4: "四",
		5: "五",
		6: "六",
		full: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
		short: ["日", "一", "二", "三", "四", "五", "六"],
	},

	calendar: {
		title: "日历",
		week: "周视图",
		month: "月视图",
		prevWeek: "上一周",
		nextWeek: "下一周",
		prevMonth: "上个月",
		nextMonth: "下个月",
		today: "今天",
		thisWeek: "本周",
		thisMonth: "本月",
		undo: "撤销",
		redo: "重做",
		selectMode: "选择模式",
		exitSelectMode: "退出选择",
		batchDelete: "批量删除",
		batchMove: "移动时间",
		batchTag: "修改标签",
		selected: (n: number) => `已选 ${n} 个`,
		noTasksWeek: "本周暂无任务",
		allDay: "全天",
		weekOf: (d: string) => `${d} 所在周`,
		smartReminder: "智能提醒",
		smartReminderTooltip: (count: number) =>
			`今天和明天有 ${count} 个任务未完成且未规划`,
		noPendingDueTasks: "暂无即将截止的任务",
		dueTasksCount: (count: number) => `${count} 个任务`,
		dueSoon: "即将截止",
		overdue: "已过期",
	},

	dateNote: {
		title: "日期备注",
		addNote: "添加备注",
		addDateNote: "添加日期备注",
		editNote: "编辑备注",
		placeholder: "为这一天添加备注...",
		delete: "删除备注",
		deleteConfirm: "确定要删除这条备注吗？",
		noNote: "暂无备注",
		save: "保存",
		cancel: "取消",
	},

	stats: {
		title: "统计复盘",
		timeRange: "时间范围",
		day: "今日",
		week: "本周",
		month: "本月",
		custom: "自定义",
		from: "开始",
		to: "结束",
		tagBreakdown: "时间账本",
		tagBreakdownDesc: "各标签时间占比",
		noTag: "无标签",
		efficiency: "效率趋势",
		efficiencyDesc: "每日完成任务时长（小时）",
		thisPeriod: "本期",
		prevPeriod: "上期",
		totalFocus: "专注总时长",
		completedTasks: "完成任务数",
		streak: "连续规划天数",
		hours: "小时",
		days: "天",
		tasks: "任务",
		growth: "环比",
		noData: "所选时间段暂无数据",
		noDataDesc: "完成一些任务后这里会显示统计信息",
		minutes: "分钟",
		details: "明细",
	},

	settings: {
		title: "设置",
		tags: "标签管理",
		tagsDesc: "管理任务标签和颜色",
		addTag: "新增标签",
		editTag: "编辑标签",
		deleteTag: "删除标签",
		tagName: "标签名称",
		tagNamePlaceholder: "如：学习、运动",
		tagColor: "标签颜色",
		tagDeleteConfirm: "删除标签后，使用该标签的任务将失去此标签，确认删除？",
		activeTags: "使用中标签",
		archivedTags: "已归档标签",
		archivedTagsHint: "已归档标签不会出现在新建任务中，但仍会在使用过它的任务上显示",
		archiveTag: "归档标签",
		restoreTag: "恢复标签",
		notifications: "通知设置",
		notificationsDesc: "任务开始和结束时发送通知",
		notificationsDescWeb: "任务开始和结束时发送浏览器通知",
		enableNotifications: "开启通知",
		notificationsGranted: "已授权",
		notificationsDenied: "已拒绝，请在系统设置中手动开启",
		notificationsDeniedWeb: "已拒绝，请在浏览器设置中手动开启",
		notificationsDeniedAlert: "通知权限被拒绝，无法启用通知功能",
		notificationsDefault: "点击开启后将请求授权",
		notificationTitle: "任务开始",
		notificationTitleAdvance: "任务即将开始",
		notificationTitleEnd: "任务结束",
		advanceNotification: "提前通知",
		advanceNotificationDesc: "任务开始前多久发送提醒",
		never: "永不",
		minutes: "分钟",
		showStartNotification: "任务开始通知",
		showStartNotificationDesc: "任务开始时显示通知",
		showEndNotification: "任务结束通知",
		showEndNotificationDesc: "任务结束时显示通知",
		language: "语言 / Language",
		languageDesc: "选择界面语言",
		zh: "简体中文",
		en: "English",
		closeBehavior: "关闭行为",
		closeBehaviorDesc: "点击关闭按钮时的行为",
		closeBehaviorExit: "退出程序",
		closeBehaviorTray: "最小化到托盘",
		autoLaunch: "开机自启",
		autoLaunchDesc: "应用将在系统启动时自动运行",
		dataManagement: "数据管理",
		export: "导出数据",
		exportDesc: "将所有数据导出为 JSON 文件",
		import: "导入数据",
		importDesc: "从 JSON 文件导入数据",
		importDialogTitle: "导入数据",
		importMode: "导入模式",
		importMergeTitle: "合并",
		importMergeDesc: "保留现有数据，添加新数据",
		importOverwriteTitle: "覆盖",
		importOverwriteDesc: "替换所有现有数据",
		importConfirm: "确认导入",
		importFileVersion: "文件版本",
		importFileDate: "导出时间",
		importSuccess: "导入成功",
		importError: "导入失败，文件格式不正确",
		exportSuccess: "数据导出成功",
		importSelectItems: "选择要导入的内容",
		selectAll: "全选",
		deselectAll: "取消全选",
		importTasks: "任务",
		importTags: "标签",
		importDateNotes: "日期备注",
		importNotes: "笔记",
		importNoteLines: "笔记连线",
		importSettings: "设置",
		importPomodoro: "番茄钟状态",
		about: "关于",
		aboutDesc: "PlanIt — 学生个人时间管理应用",
		versionPrefix: "版本 ",
		madeWith: "用心制作",
		author: "作者",
		officialWebsite: "官网",
		sponsor: "赞助支持",
		otherProjects: "更多作品",
		otherProjectsDesc: "探索更多实用工具",
		econgrapher: "EconGrapher",
		econgrapherDesc: "一键生成专业经济学图表，AP微观/宏观经济学备考神器",
		econgrapherTag: "AI驱动",
		gpaCalculator: "GPA Calculator",
		gpaCalculatorDesc: "简洁高效的加权GPA计算器，支持多种评分体系",
		gpaCalculatorTag: "学生必备",
		teamsCrypt: "TeamsCrypt",
		teamsCryptDesc: "为学生打造的 Microsoft Teams 加密聊天扩展，保护隐私安全",
		teamsCryptTag: "隐私保护",
		canvaHelper: "CanvaHelper",
		canvaHelperDesc: "Canva 海量素材，无需会员，付费素材也能用，创作更自由",
		canvaHelperTag: "设计神器",
		sound: "音效设置",
		soundDesc: "任务事件音效提醒",
		enableSound: "开启音效",
		playOnTaskStart: "任务开始时播放",
		playOnTaskEnd: "任务结束时播放",
		playOnTaskComplete: "任务完成时播放",
		playOnTaskDrag: "任务拖拽时播放",
		taskTitleSuggest: "历史任务推荐",
		taskTitleSuggestDesc: "新建任务输入标题时，基于历史任务标题进行文字匹配推荐",
		startupPage: "启动页面",
		startupPageDesc: "应用启动时显示的页面",
		startupPageHome: "主页",
		startupPageCalendar: "日历",
		startupPageTodo: "待办",
		startupPageNote: "笔记",
		startupPageStats: "统计",
		startupPageSettings: "设置",
		checkUpdate: "检查更新",
		updateAvailable: "发现新版本",
		updateLatest: "已是最新版本",
		updateError: "检查更新失败",
		updateDownloading: "正在下载更新...",
		updateInstalled: "更新完成，即将重启应用",
		updateChecking: "正在检查更新...",
		checking: "检查中...",
		general: "通用",
		clickToStartUpdate: "点击确定开始更新",
		updateNetworkError: "网络错误，请检查网络连接",
		updateTimeoutError: "请求超时，请重试",
	},
	update: {
		updateAvailable: "发现新版本",
		updateDesc: "有新版本可用，是否现在更新？",
		updateNow: "立即更新",
		remindLater: "稍后",
		skipThisVersion: "此版本不再提醒",
		downloading: "下载中...",
		clickToStartUpdate: "点击确定开始更新",
	},

	batch: {
		title: "批量操作",
		delete: "删除所选",
		deleteConfirm: (n: number) => `确定要删除所选的 ${n} 个任务吗？`,
		move: "移动到",
		moveDate: "目标日期",
	},

	pomodoro: {
		title: "番茄时钟",
		start: "开始",
		pause: "暂停",
		resume: "继续",
		reset: "重置",
		stop: "停止",
		work: "专注时间",
		shortBreak: "短休息",
		longBreak: "长休息",
		startPomodoro: "开始番茄时钟",
		session: "番茄",
		sessions: "番茄",
		completed: "已完成",
		of: "/",
		nextPhase: "下一阶段",
		fullscreen: "全屏",
		exitFullscreen: "退出全屏",
		workDuration: "专注时长（分钟）",
		shortBreakDuration: "短休息时长（分钟）",
		longBreakDuration: "长休息时长（分钟）",
		workSessionsBeforeLongBreak: "长休息前专注次数",
		autoStartBreaks: "自动开始休息",
		autoStartWork: "自动开始专注",
		currentTask: "当前任务",
		noActiveTask: "暂无进行中的任务",
		focusNow: "正在专注",
		skipBreaks: "跳过休息时间",
		settingsDesc: "专注时间设置",
		quickCreateTask: "快速创建任务",
		breaks: "休息",
		actualEnd: "实际结束",
		scheduledEnd: "计划结束",
		focusDuration: "专注时长",
		focusComplete: "专注完成",
		continueFocus: "继续专注",
		startLongBreak: "开始长休息",
		summary: "结算",
		minutes: "分钟",
		complete: "完成",
		skip: "跳过",
		continue: "继续",
		break: "休息",
		phase: "阶段",
		bindTaskToFocus: "绑定任务到本次专注",
		selectTask: "选择任务",
		createNewTask: "创建新任务",
		noTaskBinding: "不绑定任务",
		taskBindingComplete: "本次专注已绑定任务,数据已自动填写",
		manualStop: "手动终止",
		manualStopDesc: "本次专注被手动终止",
		writeToTask: "写入绑定任务",
		skipWriteToTask: "不写入",
		searchTask: "搜索任务",
		filterByTag: "按标签筛选",
		noDate: "无日期",
		today: "今天",
		tomorrow: "明天",
		thisWeek: "本周",
		future: "未来",
		noMatchingTask: "没有匹配的任务",
		focusDurationDetail: (minutes: number, seconds: number) =>
			`专注时长: ${minutes}分${seconds > 0 ? `${seconds}秒` : ""}`,
		pomodoroCount: (count: number) => `已完成 ${count} 个番茄钟`,
		allDay: "全天",
		due: "截止",
		overdue: "已过期",
		dueSoon: "即将到期",
		pendingStatus: "待办",
	},

	todo: {
		title: "待办事项",
		subtitle: "管理所有任务",
		viewMode: {
			label: "视图模式",
			byDate: "按计划日期",
			byDueDate: "按截止日期",
		},
		timeFilter: {
			label: "时间范围",
			all: "全部",
			today: "今天",
			week: "本周",
			month: "本月",
			overdue: "已逾期",
			upcoming: "即将到来",
		},
		statusFilter: {
			label: "任务状态",
			all: "全部状态",
			pending: "待处理",
			completed: "已完成",
			skipped: "已跳过",
		},
		tagFilter: {
			label: "按标签筛选",
			all: "全部标签",
		},
		sortBy: {
			label: "排序方式",
			date: "按日期",
			time: "按时间",
			title: "按标题",
			status: "按状态",
		},
		sortOrder: {
			label: "排序方向",
			asc: "正向",
			desc: "逆向",
		},
		groupBy: {
			label: "分组方式",
			none: "不分组",
			date: "按日期",
			status: "按状态",
			tag: "按标签",
		},
		allDayEvents: "全天事件",
		scheduledTasks: "已计划任务",
		noTasks: "暂无任务",
		noTasksDesc: "创建一个新任务开始你的规划",
		addTask: "新建任务",
		completedCount: (done: number, total: number) =>
			`已完成 ${done} / ${total}`,
	},

	note: {
		title: "笔记",
		subtitle: "便利贴式笔记管理",
		newNote: "新建笔记",
		editNote: "编辑笔记",
		deleteNote: "删除笔记",
		deleteConfirm: "确定要删除这条笔记吗？",
		markComplete: "标记完成",
		markActive: "标记未完成",
		titlePlaceholder: "笔记标题",
		contentPlaceholder: "开始写笔记...",
		noNotes: "暂无笔记",
		noNotesDesc: "创建一个新笔记开始记录你的想法",
		untitled: "无标题",
		jumpToNote: "跳转到笔记",
		tryDifferentKeywords: "尝试其他关键词",
		jump: "跳转",
		navigate: "导航",
		searchDescription: "在笔记中搜索",
		quickSearch: "快速搜索",
		searchPlaceholder: "搜索笔记...",
		shortcutKey: "快捷键",
		captureThoughts: "记录想法",
		savedSuccessfully: "保存成功",
		quickNote: "快速笔记",
		quickNoteTitle: "快速笔记",
		placeholder: "记录你的想法...",
		quickNotePlaceholder: "记录你的瞬间想法...",
		pleaseEnterContent: "请输入内容",
		shortcutKeyHint: "⌘ + Enter",
		keyboardShortcut: "⌘ + Enter",
		save: "保存",
		colors: {
			yellow: "黄色",
			pink: "粉色",
			blue: "蓝色",
			green: "绿色",
			purple: "紫色",
			orange: "橙色",
		},
		toolbar: {
			bold: "粗体",
			italic: "斜体",
			underline: "下划线",
			strikethrough: "删除线",
			fontSize: "字号",
			textColor: "文字颜色",
			bulletList: "无序列表",
			numberedList: "有序列表",
			alignLeft: "左对齐",
			alignCenter: "居中",
			alignRight: "右对齐",
		},
		prevDay: "前一天",
		nextDay: "后一天",
		today: "今天",
		completed: "已完成",
		active: "进行中",
		line: {
			editLine: "编辑连线",
			deleteLine: "删除连线",
			deleteLineConfirm: "确定要删除这条连线吗？",
			lineType: "连线类型",
			lineColor: "连线颜色",
			straight: "直线",
			arrow: "箭头",
			viewConnections: "查看连接",
			noConnections: "暂无连接",
		},
	},

	tray: {
		show: "显示主窗口",
		hide: "隐藏到托盘",
		addTask: "添加任务",
		pomodoro: "番茄钟",
		startFocus: "开始专注",
		stopFocus: "停止专注",
		shortBreak: "休息5分钟",
		longBreak: "休息15分钟",
		focusMode: "聚焦模式",
		enterFocusMode: "进入聚焦模式",
		exitFocusMode: "退出聚焦模式",
		settings: "设置",
		checkUpdate: "检查更新",
		visitWebsite: "访问官网",
		contactUs: "联系我们",
		quit: "退出",
		tooltip: "PlanIt - 专注效率",
	},

	timeline: {
		newDay: "新的一天开始",
		dayEnd: "一天结束",
		clickToAddTask: "点击任意时间段创建任务",
	},

	progress: {
		todayProgress: "今日进度",
		completed: "已完成",
		noTasksToday: "暂无任务",
		progressLabel: (done: number, total: number) =>
			`今日任务：${done}/${total} 已完成`,
	},

	currentTask: {
		focusing: "正在专注",
		paused: "已暂停",
		inProgress: "进行中",
		upcoming: "即将开始",
		focus: "开始专注",
		noCurrentTask: "暂无进行中的任务",
	},

	customLayout: {
		widgets: "组件面板",
		openWidgetPanel: "打开组件面板",
		switchLayout: "切换布局",
		more: "更多",
		exportLayout: "导出布局",
		importLayout: "导入布局",
		newLayout: "新建布局",
		layoutName: "布局名称",
		enterLayoutName: "输入布局名称",
		width: "宽度 (px)",
		height: "高度 (px)",
		max: "最大",
		default: "默认",
		sizeNote: "最小: 400×300，最大: 3840×2160。布局创建后尺寸不可修改。",
		cancel: "取消",
		create: "创建",
		pasteLayoutJson: "粘贴布局JSON",
		import: "导入",
		rename: "重命名",
		copy: "复制",
		delete: "删除",
		customLayout: "自定义布局",
		clickToEditTitle: "点击编辑标题",
		layers: "层级",
		layerManager: "组件层级管理",
		noWidgets: "暂无组件",
		save: "保存",
		emptyCanvas: "画布为空",
		dragWidgetHere: "从左侧面板拖拽组件到此处",
		releaseToAdd: "释放以添加组件",
		restoreDefault: "恢复默认",
		searchWidgets: "搜索组件...",
		noWidgetsFound: "未找到匹配的组件",
	},
	dateRangePicker: {
		title: "选择计划时间",
		description: "按住并拖拽选择时间段，松开完成选择",
		selected: "已选择",
		selecting: " (正在选择中...)",
		clickToEdit: " (点击编辑)",
		editTitle: "编辑计划时间",
		editDescription: "手动调整日期和时间",
		date: "日期",
		startTime: "开始时间",
		endTime: "结束时间",
	},
	widgets: {
		calculator: "计算器",
		history: "历史记录",
		spinWheel: "转盘",
		options: "选项",
		option: "选项",
		addOption: "添加选项",
		spin: "转动",
		quote: "名言",
		refresh: "刷新",
		copy: "复制",
		timer: "计时器",
		countdown: "倒计时",
		stopwatch: "秒表",
		start: "开始",
		pause: "暂停",
		reset: "重置",
		hours: "时",
		minutes: "分",
		seconds: "秒",
		preset: "预设",
		search: "搜索",
		searchPlaceholder: "搜索...",
		searchHistory: "搜索历史",
		clearHistory: "清除历史",
		todo: "待办",
		addTask: "添加任务",
		noTasks: "暂无任务",
		note: "笔记",
		placeholder: "写点什么...",
		pomodoro: "番茄钟",
		focus: "专注",
		shortBreak: "短休息",
		longBreak: "长休息",
		progress: "进度",
		currentTask: "当前任务",
		noCurrentTask: "暂无进行中的任务",
		datetime: "日期时间",
		timeline: "时间线",
		countdownWidget: "倒计时",
		targetDate: "目标日期",
		daysLeft: "天",
		textWidget: "文本",
		lineWidget: "线条",
	},

	smartRecommendTest: {
		title: "智能推荐测试",
		description: "优化的混合推荐算法 - 包含近期重复任务降权",
		acceptRate: "接受率",
		avgConfidence: "平均置信度",
		noveltyRate: "探索性推荐占比",
		historicalTasks: "历史任务数",
		forPatternLearning: "用于模式学习",
		analysisOverview: "智能分析概览",
		timeRelationPatterns: "时间关系模式",
		periodicPatterns: "周期性模式",
		predictedTasks: "预测任务",
		dynamicRules: "动态规则",
		tabRecommend: "推荐结果",
		tabTest: "参数测试",
		tabLogs: "日志记录",
		createTask: "创建任务",
		resetData: "重置数据",
		exportData: "导出数据",
		exportDataDesc: "导出当前学习数据为 JSON 文件",
		importData: "导入数据",
		importDataDesc: "导入之前的学习数据",
		exportSuccess: "数据导出成功",
		importSuccess: "导入成功",
		importError: "导入失败，文件格式不正确",
		selectImportMode: "选择导入模式",
		importMerge: "合并",
		importMergeDesc: "保留现有数据，添加新数据",
		importOverwrite: "覆盖",
		importOverwriteDesc: "替换所有现有数据",
		importFileVersion: "文件版本",
		importFileDate: "导出时间",
		importConfirm: "确认导入",
		importItems: "导入内容",
		importTasksCount: (n: number) => `${n} 个任务`,
		importFeedbacksCount: (n: number) => `${n} 条反馈`,
		importLogsCount: (n: number) => `${n} 条日志`,
		noDataToExport: "没有数据可导出",
	},

	duplicateTest: {
		title: "行为预测重复检测",
		description: "验证任务创建后系统是否会重复推荐与已创建任务相同或近重复的任务",
		runAll: "运行全部测试",
		reset: "重置",
		runSingle: "运行",
		rerun: "重新运行",
		statusPending: "未执行",
		statusPassed: "通过",
		statusFailed: "失败",
		catAll: "全部类别",
		catExact: "完全重复",
		catNear: "近重复",
		catBehavior: "行为模式",
		catPeriodic: "周期模式",
		catBoundary: "边界条件",
		expected: "预期结果",
		actual: "实际结果",
		diff: "差异对比",
		anomalyAnalysis: "异常分析",
		optimizationSuggestion: "优化方向",
		passRate: "通过率",
		summary: "测试概览",
		scenarioList: "测试场景列表",
		report: "聚合报告",
		flaggedCount: "命中数",
		noRecommendations: "无推荐产生",
		matchedCriteria: "命中条件",
		initialTasks: "初始任务",
		contextTimeLabel: "上下文时间",
		createdTask: "新建任务",
		commonPatterns: "常见异常模式",
		prioritizedSuggestions: "优先优化建议",
		noReport: "尚未运行测试，点击「运行全部测试」生成报告",
		noResults: "暂无测试结果",
		runHint: "选择类别过滤后点击运行",
		scenarios: {
			"exact-same-time": {
				name: "完全相同时间槽",
				desc: "创建与已有任务同标题、同日期、同开始时间的任务，系统应过滤重复推荐",
				anomaly: "若失败：hasExactDuplicateScheduledTask 未正确识别完全时间碰撞",
				suggestion: "确认 isExactTimeCollision 对同 date + 同 startTime 的判定路径",
			},
			"exact-all-day": {
				name: "全天事件完全重复",
				desc: "创建与已有全天任务同标题、同日期的全天任务，系统应过滤",
				anomaly: "若失败：bothAllDay 分支未正确触发过滤",
				suggestion: "校验 isExactTimeCollision 中 isAllDay 与 date 的组合判定",
			},
			"exact-multiple": {
				name: "多条历史相同任务",
				desc: "已有 3 条相同任务后创建第 4 条同日期同时段任务，不应产生重复推荐",
				anomaly: "若失败：多历史任务场景下重复检测被稀释",
				suggestion: "确保重复检测对全部历史任务遍历，而非仅最近一条",
			},
			"near-diff-time": {
				name: "同标题同日期不同时间",
				desc: "新任务 14:00 与已有 09:00 同标题同日期，系统不应再推荐同日同标题任务",
				anomaly: "近重复泄漏：calculateDuplicatePenalty 仅对完全碰撞返回 0，同日期仅 0.6 不足以压低置信度",
				suggestion: "将同标题+同日期的近重复判定扩展为：title 相似度>=0.9 且 date 相同即视为重复，无需 startTime 相等",
			},
			"near-diff-date": {
				name: "同标题同时间不同日期",
				desc: "新任务与已有任务同标题同 startTime 但日期不同，系统不应在邻近日期推荐同标题同时间任务",
				anomaly: "近重复泄漏：不同日期无任何惩罚，置信度不受影响",
				suggestion: "对同标题+同 startTime 且日期邻近（如 3 天内）的推荐施加惩罚或过滤",
			},
			"near-whitespace-case": {
				name: "标题空格大小写变体",
				desc: "标题「  Math  Exercise 」与已有「math exercise」应视为相同任务",
				anomaly: "normalizeTitle 仅 trim+lowercase+单空格压缩，无法处理多空格；calculateNameSimilarityScore 也仅 trim",
				suggestion: "在 normalizeTitle 中增加 /\\s+/g → 单空格的归一化，并在重复检测中使用归一化标题比较",
			},
			"near-missing-time": {
				name: "新建任务缺失开始时间",
				desc: "新任务无 startTime，已有任务有 09:00；行为预测会填充 09:00，导致推荐与已创建任务高度相似",
				anomaly: "enhanceTaskWithPredictions 用 behaviorPredictor.predictTime 填充时间，使推荐时间撞上已有槽位",
				suggestion: "推荐生成后比对已有任务，若仅 startTime 缺失而被填充至已有槽位，应降权或过滤",
			},
			"behavior-just-created": {
				name: "刚创建任务不应被回显",
				desc: "用户刚创建任务 T，推荐列表不应再包含 T 本身",
				anomaly: "若失败：uniqueTitles 选取最新任务作为推荐源，且时间增强后未与新建任务碰撞",
				suggestion: "对刚创建任务（createdAt 接近 contextTime）的标题在推荐源中排除或大幅降权",
			},
			"behavior-repeated-creation": {
				name: "重复创建不应保留同槽位",
				desc: "同任务同槽位已创建 3 次，第 4 次推荐列表不应保留相同时间槽",
				anomaly: "若失败：周期或历史推荐未避开已多次出现的时间槽",
				suggestion: "推荐生成时统计同标题已有出现次数，超过阈值后下次推荐应跳到新时间槽",
			},
			"behavior-accepted-rec": {
				name: "已接受推荐不应再次出现",
				desc: "用户接受推荐（追加到任务列表）后，再次生成推荐时同一推荐不应再次出现",
				anomaly: "若失败：接受后任务进入历史，但仍被作为推荐源重新生成",
				suggestion: "推荐后处理阶段排除最近 N 分钟内被接受/创建的任务标题",
			},
			"periodic-daily-existing-date": {
				name: "日度预测避开已有日期",
				desc: "已有 4 条日度早晨任务，预测下次出现日期不应是已存在的日期",
				anomaly: "PeriodicTaskDetector.generateNextOccurrence 不检查预测日期是否已存在出现记录",
				suggestion: "在 generateNextOccurrence 中跳过已有 occurrences 的日期，向未来推进直到找到新日期",
			},
			"periodic-weekly-existing-date": {
				name: "周度预测避开已有日期",
				desc: "已有 4 条周一任务，预测下次出现不应落在已存在的周一",
				anomaly: "generateNextOccurrence 的 weekly 分支 daysToAdd<=0 +=7 可能落在已存在的下一个周一",
				suggestion: "weekly 分支同样需要过滤已有出现日期",
			},
			"boundary-empty": {
				name: "空任务列表边界",
				desc: "无初始任务，创建第一条任务后不应崩溃且无重复推荐",
				anomaly: "若失败：空列表导致除零或 undefined 访问",
				suggestion: "对 tasks.length===0 的边界显式返回空推荐",
			},
			"boundary-single-task": {
				name: "单任务列表边界",
				desc: "一条初始任务，创建同标题不同日期任务，不应产生同日期碰撞",
				anomaly: "若失败：单任务统计不足以形成模式但仍产生推荐",
				suggestion: "样本量不足时降低置信度或跳过历史推荐生成",
			},
			"boundary-past-due": {
				name: "截止日期在过去",
				desc: "新任务 dueDate 在过去，引擎不应崩溃且不应推荐重复",
				anomaly: "若失败：dueDate 在过去导致 differenceInDays 异常或推荐时间倒置",
				suggestion: "对 dueDate < contextTime 的任务在推荐前显式过滤或归一化",
			},
		},
	},
} as const;

const en = {
	appName: "PlanIt",
	appTagline: "Student Time Manager",

	nav: {
		home: "Home",
		calendar: "Calendar",
		todo: "To Do",
		note: "Notes",
		customLayout: "Custom",
		stats: "Stats",
		settings: "Settings",
	},

	common: {
		save: "Save",
		cancel: "Cancel",
		delete: "Delete",
		edit: "Edit",
		add: "Add",
		confirm: "Confirm",
		close: "Close",
		minimize: "Minimize",
		maximize: "Maximize",
		restore: "Restore",
		noData: "No data",
		loading: "Loading...",
		success: "Success",
		error: "Error",
		optional: "optional",
		required: "required",
		all: "All",
		today: "Today",
		tomorrow: "Tomorrow",
		yesterday: "Yesterday",
		select: "Select",
		selectAll: "Select All",
		clearSelection: "Clear Selection",
		skip: "Skip",
		reset: "Reset",
		result: "Result",
	},

	dashboard: {
		title: "Today's Board",
		greeting: (name?: string) => (name ? `Hello, ${name}` : "Hello"),
		summary: "Today's Summary",
		completed: "Done",
		total: "Total",
		tasks: "tasks",
		backToNow: "Back to Now",
		allDayEvents: "All-Day Events",
		noTasksToday: "No tasks today. Click on the timeline to create one.",
		noAllDayEvents: "No all-day events",
		clickToCreate: "Click to create task",
		progressLabel: (done: number, total: number) =>
			`${done} / ${total} tasks completed`,
	},

	task: {
		new: "New Task",
		edit: "Edit Task",
		title: "Title",
		titlePlaceholder: "Task name",
		date: "Plan Date",
		dueDate: "Due Date",
		startTime: "Start Time",
		endTime: "End Time",
		allDay: "All-day event",
		tags: "Tags",
		tagsPlaceholder: "Select tags",
		newTag: "New Tag",
		repeatRule: "Repeat",
		notes: "Notes",
		notesPlaceholder: "Add notes...",
		status: "Status",
		markComplete: "Mark Complete",
		markSkip: "Mark Skipped",
		markPending: "Mark Pending",
		deleteConfirm: "Delete this task?",
		deleteConfirmTitle: "Delete Task",
		deleteOptions: "Delete Options",
		deleteAllRepeat: "Also delete all recurring instances of this task",
		noTags: "No tags",
		dateOrDueDateRequired: "At least one of Plan Date or Due Date is required",
		advancedOptions: "Advanced Options",
		dueDateOffset: "Due Date Offset",
		dueDateOffsetDesc:
			"Number of days after plan date for due date on recurring tasks",
		days: "days",
		deleteOptionOnlyThis: "Only this task",
		deleteOptionAll: "All instances",
		deleteOptionFuture: "Future tasks only",
		deleteOptionPending: "Pending tasks only",
		minutesLeft: "min left",
		unscheduled: "Unscheduled",
		untagged: "Untagged",
		multiStep: "Multi-Step",
		stepTitle: "Step Title",
		addStep: "Add Step",
		deleteStep: "Delete Step",
		viewFutureTasks: "View Future Tasks",
		today: "Today",
		tomorrow: "Tomorrow",
		notesSyncTitle: "Notes Sync",
		notesSyncConfirm:
			"This is a recurring task. Would you like to sync the notes changes to other instances?",
		notesSyncOptions: "Sync Options",
		notesSyncOnlyThis: "Only this task",
		notesSyncAll: "Apply to all",
		notesSyncFuture: "Apply to future (excluding past)",
		notesSyncPending: "Apply to pending tasks only",
		historySuggestTitle: "History",
		historySuggestTabHint: "Confirm selection",
		historySuggestCount: (n: number) => `Used ${n} times`,
	},

	status: {
		pending: "Pending",
		completed: "Completed",
		skipped: "Skipped",
	},

	repeat: {
		label: "Repeat",
		none: "No repeat",
		daily: "Daily",
		workdays: "Workdays",
		weekly: "Weekly",
		monthly: "Monthly",
		yearly: "Yearly",
		custom: "Custom",
		customEvery: "Every",
		customDays: "days",
		customWeeks: "weeks",
		customMonths: "months",
		customYears: "years",
		endDate: "End Date",
		endDatePlaceholder: "No end date",
		weekdays: "On days",
		generating: "Will generate recurring tasks",
	},
	calendarSettings: {
		title: "Calendar Settings",
		timeRange: "Time Range",
		startTime: "Start Time",
		endTime: "End Time",
		timeSnap: "Time Snap",
		timeSnapDesc: "Time alignment precision when dragging",
		snapEnabled: "Smart Snap",
		snapEnabledDesc: "Auto-snap to nearby task edges",
		snapThreshold: "Snap Threshold",
		snapThresholdDesc: "Distance to trigger snap (minutes)",
		rowHeight: "Row height",
		hourDivisions: "Hour divisions",
		divisions: "divs",
	},

	weekdays: {
		0: "Su",
		1: "Mo",
		2: "Tu",
		3: "We",
		4: "Th",
		5: "Fr",
		6: "Sa",
		full: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
	},

	calendar: {
		title: "Calendar",
		week: "Week",
		month: "Month",
		prevWeek: "Previous Week",
		nextWeek: "Next Week",
		prevMonth: "Previous Month",
		nextMonth: "Next Month",
		today: "Today",
		thisWeek: "This Week",
		thisMonth: "This Month",
		undo: "Undo",
		redo: "Redo",
		selectMode: "Select",
		exitSelectMode: "Exit Select",
		batchDelete: "Delete Selected",
		batchMove: "Move",
		batchTag: "Edit Tags",
		selected: (n: number) => `${n} selected`,
		noTasksWeek: "No tasks this week",
		allDay: "All day",
		weekOf: (d: string) => `Week of ${d}`,
		smartReminder: "Smart Reminder",
		smartReminderTooltip: (count: number) =>
			`You have ${count} task${count > 1 ? "s" : ""} due today or tomorrow but not scheduled`,
		noPendingDueTasks: "No pending due tasks",
		dueTasksCount: (count: number) => `${count} task${count > 1 ? "s" : ""}`,
		dueSoon: "Due soon",
		overdue: "Overdue",
	},

	dateNote: {
		title: "Date Note",
		addNote: "Add Note",
		addDateNote: "Add date note",
		editNote: "Edit Note",
		placeholder: "Add a note for this day...",
		delete: "Delete Note",
		deleteConfirm: "Delete this note?",
		noNote: "No note",
		save: "Save",
		cancel: "Cancel",
	},

	stats: {
		title: "Statistics",
		timeRange: "Time Range",
		day: "Today",
		week: "This Week",
		month: "This Month",
		custom: "Custom",
		from: "From",
		to: "To",
		tagBreakdown: "Time Ledger",
		tagBreakdownDesc: "Time by tag",
		noTag: "No Tag",
		efficiency: "Efficiency Trend",
		efficiencyDesc: "Completed task hours per day",
		thisPeriod: "This Period",
		prevPeriod: "Last Period",
		totalFocus: "Total Focus Time",
		completedTasks: "Tasks Completed",
		streak: "Planning Streak",
		hours: "hrs",
		days: "days",
		tasks: "tasks",
		growth: "vs last",
		noData: "No data for selected period",
		noDataDesc: "Complete some tasks to see your stats",
		minutes: "min",
		details: "Details",
	},

	settings: {
		title: "Settings",
		tags: "Tag Management",
		tagsDesc: "Manage task tags and colors",
		addTag: "Add Tag",
		editTag: "Edit Tag",
		deleteTag: "Delete Tag",
		tagName: "Tag Name",
		tagNamePlaceholder: "e.g. Study, Exercise",
		tagColor: "Tag Color",
		tagDeleteConfirm: "Tasks using this tag will lose it. Delete?",
		activeTags: "Active Tags",
		archivedTags: "Archived Tags",
		archivedTagsHint: "Archived tags won't appear when creating new tasks, but remain visible on tasks that use them",
		archiveTag: "Archive Tag",
		restoreTag: "Restore Tag",
		notifications: "Notifications",
		notificationsDesc: "Get notified when tasks start and end",
		notificationsDescWeb: "Get browser notifications when tasks start and end",
		enableNotifications: "Enable Notifications",
		notificationsGranted: "Granted",
		notificationsDenied: "Denied — enable in system settings",
		notificationsDeniedWeb: "Denied — enable in browser settings",
		notificationsDeniedAlert:
			"Notification permission denied. Cannot enable notifications.",
		notificationsDefault: "Click to request permission",
		notificationTitle: "Task Starting",
		notificationTitleAdvance: "Task Starting Soon",
		notificationTitleEnd: "Task Ended",
		advanceNotification: "Advance Notification",
		advanceNotificationDesc: "How long before task start to send reminder",
		never: "Never",
		minutes: "minutes",
		showStartNotification: "Task Start Notification",
		showStartNotificationDesc: "Show notification when task starts",
		showEndNotification: "Task End Notification",
		showEndNotificationDesc: "Show notification when task ends",
		language: "Language / 语言",
		languageDesc: "Choose interface language",
		zh: "简体中文",
		en: "English",
		closeBehavior: "Close Behavior",
		closeBehaviorDesc: "Action when clicking the close button",
		closeBehaviorExit: "Exit Application",
		closeBehaviorTray: "Minimize to Tray",
		autoLaunch: "Auto-start on Boot",
		autoLaunchDesc: "Application will automatically run on system startup",
		dataManagement: "Data Management",
		export: "Export Data",
		exportDesc: "Export all data as JSON file",
		import: "Import Data",
		importDesc: "Import data from JSON file",
		importDialogTitle: "Import Data",
		importMode: "Import Mode",
		importMergeTitle: "Merge",
		importMergeDesc: "Keep existing data, add new data",
		importOverwriteTitle: "Overwrite",
		importOverwriteDesc: "Replace all existing data",
		importConfirm: "Confirm Import",
		importFileVersion: "File Version",
		importFileDate: "Export Date",
		importSuccess: "Import successful",
		importError: "Import failed — invalid file format",
		exportSuccess: "Data exported successfully",
		importSelectItems: "Select items to import",
		selectAll: "Select All",
		deselectAll: "Deselect All",
		importTasks: "Tasks",
		importTags: "Tags",
		importDateNotes: "Date Notes",
		importNotes: "Notes",
		importNoteLines: "Note Lines",
		importSettings: "Settings",
		importPomodoro: "Pomodoro State",
		about: "About",
		aboutDesc: "PlanIt — Student Time Management App",
		versionPrefix: "Version ",
		madeWith: "Made with care",
		author: "Author",
		officialWebsite: "Website",
		sponsor: "Sponsor",
		otherProjects: "More Projects",
		otherProjectsDesc: "Explore more useful tools",
		econgrapher: "EconGrapher",
		econgrapherDesc:
			"Generate professional economics charts instantly — ace AP Micro/Macro",
		econgrapherTag: "AI-Powered",
		gpaCalculator: "GPA Calculator",
		gpaCalculatorDesc:
			"Clean & efficient weighted GPA calculator with multiple grading scales",
		gpaCalculatorTag: "Student Essential",
		teamsCrypt: "TeamsCrypt",
		teamsCryptDesc:
			"Encrypted chat extension for Microsoft Teams, designed for students",
		teamsCryptTag: "Privacy",
		canvaHelper: "CanvaHelper",
		canvaHelperDesc:
			"Unlock premium Canva assets for free — design without limits",
		canvaHelperTag: "Design Tool",
		sound: "Sound Settings",
		soundDesc: "Sound effects for task events",
		enableSound: "Enable Sound",
		playOnTaskStart: "Play when task starts",
		playOnTaskEnd: "Play when task ends",
		playOnTaskComplete: "Play when task completes",
		playOnTaskDrag: "Play when task is dragged",
		taskTitleSuggest: "Task Title Suggestions",
		taskTitleSuggestDesc:
			"Suggest matching task titles from history while typing a new task",
		startupPage: "Startup Page",
		startupPageDesc: "Page to display when app starts",
		startupPageHome: "Home",
		startupPageCalendar: "Calendar",
		startupPageTodo: "To Do",
		startupPageNote: "Notes",
		startupPageStats: "Stats",
		startupPageSettings: "Settings",
		checkUpdate: "Check for Updates",
		updateAvailable: "New version available",
		updateLatest: "You are up to date",
		updateError: "Failed to check for updates",
		updateDownloading: "Downloading update...",
		updateInstalled: "Update complete, restarting app...",
		updateChecking: "Checking for updates...",
		checking: "Checking...",
		general: "General",
		clickToStartUpdate: "Click OK to start updating",
		updateNetworkError: "Network error. Please check your connection.",
		updateTimeoutError: "Request timed out. Please try again.",
	},
	update: {
		updateAvailable: "New version available",
		updateDesc: "A new version is available. Would you like to update now?",
		updateNow: "Update Now",
		remindLater: "Remind Me Later",
		skipThisVersion: "Skip this version",
		downloading: "Downloading...",
		clickToStartUpdate: "Click OK to start updating",
	},

	batch: {
		title: "Bulk Actions",
		delete: "Delete Selected",
		deleteConfirm: (n: number) =>
			`Delete ${n} selected task${n > 1 ? "s" : ""}?`,
		move: "Move to",
		moveDate: "Target Date",
	},

	pomodoro: {
		title: "Pomodoro Timer",
		start: "Start",
		pause: "Pause",
		resume: "Resume",
		reset: "Reset",
		stop: "Stop",
		work: "Focus Time",
		shortBreak: "Short Break",
		longBreak: "Long Break",
		startPomodoro: "Start Pomodoro",
		session: "Pomodoro",
		sessions: "Pomodoros",
		completed: "Completed",
		of: "/",
		nextPhase: "Next Phase",
		fullscreen: "Fullscreen",
		exitFullscreen: "Exit Fullscreen",
		workDuration: "Focus duration (min)",
		shortBreakDuration: "Short break (min)",
		longBreakDuration: "Long break (min)",
		workSessionsBeforeLongBreak: "Pomodoros before long break",
		autoStartBreaks: "Auto-start breaks",
		autoStartWork: "Auto-start focus",
		currentTask: "Current Task",
		noActiveTask: "No active task",
		focusNow: "Focusing now",
		skipBreaks: "Skip breaks",
		settingsDesc: "Focus time settings",
		quickCreateTask: "Quick create task",
		breaks: "Breaks",
		actualEnd: "Actual end",
		scheduledEnd: "Scheduled end",
		focusDuration: "Focus duration",
		focusComplete: "Focus complete",
		continueFocus: "Continue focus",
		startLongBreak: "Start long break",
		summary: "Finish",
		minutes: "min",
		complete: "Complete",
		skip: "Skip",
		continue: "Continue",
		break: "Break",
		phase: "Phase",
		bindTaskToFocus: "Bind task to focus session",
		selectTask: "Select task",
		createNewTask: "Create new task",
		noTaskBinding: "No task binding",
		taskBindingComplete: "Task binding complete, data auto-filled",
		manualStop: "Manual Stop",
		manualStopDesc: "This focus session was manually stopped",
		writeToTask: "Write to bound task",
		skipWriteToTask: "Skip",
		searchTask: "Search task",
		filterByTag: "Filter by tag",
		noDate: "No date",
		today: "Today",
		tomorrow: "Tomorrow",
		thisWeek: "This week",
		future: "Future",
		noMatchingTask: "No matching task",
		focusDurationDetail: (minutes: number, seconds: number) =>
			`Focus duration: ${minutes}m${seconds > 0 ? `${seconds}s` : ""}`,
		pomodoroCount: (count: number) => `${count} pomodoros completed`,
		allDay: "All day",
		due: "Due",
		overdue: "Overdue",
		dueSoon: "Due soon",
		pendingStatus: "Pending",
	},

	todo: {
		title: "To Do List",
		subtitle: "Manage all your tasks",
		viewMode: {
			label: "View Mode",
			byDate: "By Plan Date",
			byDueDate: "By Due Date",
		},
		timeFilter: {
			label: "Time Range",
			all: "All",
			today: "Today",
			week: "This Week",
			month: "This Month",
			overdue: "Overdue",
			upcoming: "Upcoming",
		},
		statusFilter: {
			label: "Task Status",
			all: "All Status",
			pending: "Pending",
			completed: "Completed",
			skipped: "Skipped",
		},
		tagFilter: {
			label: "Filter by Tag",
			all: "All Tags",
		},
		sortBy: {
			label: "Sort By",
			date: "By Date",
			time: "By Time",
			title: "By Title",
			status: "By Status",
		},
		sortOrder: {
			label: "Sort Order",
			asc: "Ascending",
			desc: "Descending",
		},
		groupBy: {
			label: "Group By",
			none: "No Grouping",
			date: "By Date",
			status: "By Status",
			tag: "By Tag",
		},
		allDayEvents: "All-Day Events",
		scheduledTasks: "Scheduled Tasks",
		noTasks: "No tasks yet",
		noTasksDesc: "Create a new task to get started",
		addTask: "Add Task",
		completedCount: (done: number, total: number) =>
			`${done} / ${total} completed`,
	},

	note: {
		title: "Notes",
		subtitle: "Sticky note management",
		newNote: "New Note",
		editNote: "Edit Note",
		deleteNote: "Delete Note",
		deleteConfirm: "Delete this note?",
		markComplete: "Mark Complete",
		markActive: "Mark Active",
		titlePlaceholder: "Note title",
		contentPlaceholder: "Start writing...",
		noNotes: "No notes yet",
		noNotesDesc: "Create a new note to start capturing your thoughts",
		untitled: "Untitled",
		jumpToNote: "Jump to note",
		tryDifferentKeywords: "Try different keywords",
		jump: "Jump",
		navigate: "Navigate",
		searchDescription: "Search in notes",
		quickSearch: "Quick search",
		searchPlaceholder: "Search notes...",
		shortcutKey: "Shortcut key",
		captureThoughts: "Capture thoughts",
		savedSuccessfully: "Saved successfully",
		quickNote: "Quick note",
		quickNoteTitle: "Quick note",
		placeholder: "Capture your thoughts...",
		quickNotePlaceholder: "Capture your fleeting thoughts...",
		pleaseEnterContent: "Please enter content",
		shortcutKeyHint: "Ctrl/⌘ + ↵",
		keyboardShortcut: "Ctrl/⌘ + ↵",
		save: "Save",
		colors: {
			yellow: "Yellow",
			pink: "Pink",
			blue: "Blue",
			green: "Green",
			purple: "Purple",
			orange: "Orange",
		},
		toolbar: {
			bold: "Bold",
			italic: "Italic",
			underline: "Underline",
			strikethrough: "Strikethrough",
			fontSize: "Font Size",
			textColor: "Text Color",
			bulletList: "Bullet List",
			numberedList: "Numbered List",
			alignLeft: "Align Left",
			alignCenter: "Align Center",
			alignRight: "Align Right",
		},
		prevDay: "Previous Day",
		nextDay: "Next Day",
		today: "Today",
		completed: "Completed",
		active: "Active",
		line: {
			editLine: "Edit Line",
			deleteLine: "Delete Line",
			deleteLineConfirm: "Delete this line?",
			lineType: "Line Type",
			lineColor: "Line Color",
			straight: "Straight",
			arrow: "Arrow",
			viewConnections: "View Connections",
			noConnections: "No connections",
		},
	},

	tray: {
		show: "Show Main Window",
		hide: "Hide to Tray",
		addTask: "Add Task",
		pomodoro: "Pomodoro",
		startFocus: "Start Focus",
		stopFocus: "Stop Focus",
		shortBreak: "5 Min Break",
		longBreak: "15 Min Break",
		focusMode: "Focus Mode",
		enterFocusMode: "Enter Focus Mode",
		exitFocusMode: "Exit Focus Mode",
		settings: "Settings",
		checkUpdate: "Check for Updates",
		visitWebsite: "Visit Website",
		contactUs: "Contact Us",
		quit: "Quit",
		tooltip: "PlanIt - Focus & Productivity",
	},

	timeline: {
		newDay: "New Day",
		dayEnd: "Day End",
		clickToAddTask: "Click any time slot to add a task",
	},

	progress: {
		todayProgress: "Today's Progress",
		completed: "completed",
		noTasksToday: "No tasks today",
		progressLabel: (done: number, total: number) =>
			`${done}/${total} tasks completed`,
	},

	currentTask: {
		focusing: "Focusing",
		paused: "Paused",
		inProgress: "In Progress",
		upcoming: "Upcoming",
		focus: "Focus",
		noCurrentTask: "No current task",
	},

	customLayout: {
		widgets: "Widgets",
		openWidgetPanel: "Open Widget Panel",
		switchLayout: "Switch Layout",
		more: "More",
		exportLayout: "Export Layout",
		importLayout: "Import Layout",
		newLayout: "New Layout",
		layoutName: "Layout Name",
		enterLayoutName: "Enter layout name",
		width: "Width (px)",
		height: "Height (px)",
		max: "Max",
		default: "Default",
		sizeNote:
			"Min: 400×300, Max: 3840×2160. Canvas size cannot be modified after creation.",
		cancel: "Cancel",
		create: "Create",
		pasteLayoutJson: "Paste layout JSON",
		import: "Import",
		rename: "Rename",
		copy: "Copy",
		delete: "Delete",
		customLayout: "Custom Layout",
		clickToEditTitle: "Click to edit title",
		layers: "Layers",
		layerManager: "Widget Layer Manager",
		noWidgets: "No widgets",
		save: "Save",
		emptyCanvas: "Canvas is empty",
		dragWidgetHere: "Drag widgets from the left panel here",
		releaseToAdd: "Release to add widget",
		restoreDefault: "Restore Default",
		searchWidgets: "Search widgets...",
		noWidgetsFound: "No matching widgets found",
	},
	dateRangePicker: {
		title: "Select plan time",
		description: "Press and drag to select a time slot, release to confirm",
		selected: "Selected",
		selecting: " (selecting...)",
		clickToEdit: " (click to edit)",
		editTitle: "Edit plan time",
		editDescription: "Manually adjust date and time",
		date: "Date",
		startTime: "Start time",
		endTime: "End time",
	},
	widgets: {
		calculator: "Calculator",
		history: "History",
		spinWheel: "Spin Wheel",
		options: "Options",
		option: "Option",
		addOption: "Add Option",
		spin: "Spin",
		quote: "Quote",
		refresh: "Refresh",
		copy: "Copy",
		timer: "Timer",
		countdown: "Countdown",
		stopwatch: "Stopwatch",
		start: "Start",
		pause: "Pause",
		reset: "Reset",
		hours: "h",
		minutes: "m",
		seconds: "s",
		preset: "Preset",
		search: "Search",
		searchPlaceholder: "Search...",
		searchHistory: "Search History",
		clearHistory: "Clear History",
		todo: "Todo",
		addTask: "Add Task",
		noTasks: "No Tasks",
		note: "Note",
		placeholder: "Write something...",
		pomodoro: "Pomodoro",
		focus: "Focus",
		shortBreak: "Short Break",
		longBreak: "Long Break",
		progress: "Progress",
		currentTask: "Current Task",
		noCurrentTask: "No active task",
		datetime: "Date & Time",
		timeline: "Timeline",
		countdownWidget: "Countdown",
		targetDate: "Target Date",
		daysLeft: "d",
		textWidget: "Text",
		lineWidget: "Line",
	},

	smartRecommendTest: {
		title: "Smart Recommendation Test",
		description: "Optimized hybrid recommendation algorithm - includes recent duplicate task downweighting",
		acceptRate: "Acceptance Rate",
		avgConfidence: "Avg Confidence",
		noveltyRate: "Exploration Rate",
		historicalTasks: "Historical Tasks",
		forPatternLearning: "for pattern learning",
		analysisOverview: "Smart Analysis Overview",
		timeRelationPatterns: "Time Relation Patterns",
		periodicPatterns: "Periodic Patterns",
		predictedTasks: "Predicted Tasks",
		dynamicRules: "Dynamic Rules",
		tabRecommend: "Recommendations",
		tabTest: "Parameter Test",
		tabLogs: "Logs",
		createTask: "Create Task",
		resetData: "Reset Data",
		exportData: "Export Data",
		exportDataDesc: "Export current learning data as JSON file",
		importData: "Import Data",
		importDataDesc: "Import previous learning data",
		exportSuccess: "Data exported successfully",
		importSuccess: "Import successful",
		importError: "Import failed — invalid file format",
		selectImportMode: "Select Import Mode",
		importMerge: "Merge",
		importMergeDesc: "Keep existing data, add new data",
		importOverwrite: "Overwrite",
		importOverwriteDesc: "Replace all existing data",
		importFileVersion: "File Version",
		importFileDate: "Export Date",
		importConfirm: "Confirm Import",
		importItems: "Import Items",
		importTasksCount: (n: number) => `${n} tasks`,
		importFeedbacksCount: (n: number) => `${n} feedbacks`,
		importLogsCount: (n: number) => `${n} logs`,
		noDataToExport: "No data to export",
	},

	duplicateTest: {
		title: "Behavior Prediction Duplication",
		description: "Verifies that the engine does not re-recommend tasks identical or near-identical to ones the user just created",
		runAll: "Run All Tests",
		reset: "Reset",
		runSingle: "Run",
		rerun: "Rerun",
		statusPending: "Pending",
		statusPassed: "Passed",
		statusFailed: "Failed",
		catAll: "All Categories",
		catExact: "Exact Duplicate",
		catNear: "Near Duplicate",
		catBehavior: "Behavior Pattern",
		catPeriodic: "Periodic Pattern",
		catBoundary: "Boundary",
		expected: "Expected",
		actual: "Actual",
		diff: "Diff",
		anomalyAnalysis: "Anomaly Analysis",
		optimizationSuggestion: "Optimization Suggestion",
		passRate: "Pass Rate",
		summary: "Summary",
		scenarioList: "Scenario List",
		report: "Aggregate Report",
		flaggedCount: "Flagged",
		noRecommendations: "No recommendations produced",
		matchedCriteria: "Matched Criteria",
		initialTasks: "Initial Tasks",
		contextTimeLabel: "Context Time",
		createdTask: "Created Task",
		commonPatterns: "Common Anomaly Patterns",
		prioritizedSuggestions: "Prioritized Suggestions",
		noReport: "No tests have been run yet. Click \"Run All Tests\" to generate a report.",
		noResults: "No test results yet",
		runHint: "Filter by category then click Run",
		scenarios: {
			"exact-same-time": {
				name: "Identical Time Slot",
				desc: "Create a task identical to an existing one (same title, date, 09:00). The engine should filter the duplicate.",
				anomaly: "If failed: hasExactDuplicateScheduledTask failed to detect the exact time collision.",
				suggestion: "Verify isExactTimeCollision path for same date + same startTime.",
			},
			"exact-all-day": {
				name: "All-Day Duplicate",
				desc: "Create an all-day task identical to an existing all-day task. The engine should filter it.",
				anomaly: "If failed: the bothAllDay branch did not trigger filtering.",
				suggestion: "Verify the isAllDay + date combination in isExactTimeCollision.",
			},
			"exact-multiple": {
				name: "Multiple Historical Duplicates",
				desc: "With 3 existing identical tasks, creating a 4th at the same slot must not yield a duplicate rec.",
				anomaly: "If failed: duplicate detection is diluted across multiple historical tasks.",
				suggestion: "Ensure duplicate detection iterates all historical tasks, not only the most recent.",
			},
			"near-diff-time": {
				name: "Same Title + Same Date, Different Time",
				desc: "New task at 14:00 vs existing 09:00 (same title, same date). Engine should not recommend the same-title same-date task.",
				anomaly: "Near-duplicate leak: calculateDuplicatePenalty returns 0 only for exact collision; same-date yields only 0.6, insufficient to push confidence below threshold.",
				suggestion: "Treat title similarity>=0.9 AND same date as a duplicate, regardless of startTime.",
			},
			"near-diff-date": {
				name: "Same Title + Same Time, Different Date",
				desc: "New task and existing task share title and startTime but on different dates. Engine should not recommend same-title same-time task on a nearby date.",
				anomaly: "Near-duplicate leak: different dates receive no penalty, confidence unaffected.",
				suggestion: "Apply penalty or filter for same-title + same-startTime recommendations within a date proximity window (e.g., 3 days).",
			},
			"near-whitespace-case": {
				name: "Title Whitespace/Case Variants",
				desc: "Title \"  Math  Exercise \" vs existing \"math exercise\" should be treated as the same task.",
				anomaly: "normalizeTitle only trims+lowercases+collapses single spaces; multi-space not handled. calculateNameSimilarityScore only trims.",
				suggestion: "Normalize whitespace with /\\s+/g -> single space in normalizeTitle and use normalized comparison in duplicate detection.",
			},
			"near-missing-time": {
				name: "Created Task Missing Start Time",
				desc: "New task has no startTime; existing task has 09:00. Behavior prediction fills 09:00, making the recommendation match an existing slot.",
				anomaly: "enhanceTaskWithPredictions uses behaviorPredictor.predictTime to fill startTime, colliding with existing slot.",
				suggestion: "After generating recommendations, compare against existing tasks; if startTime was filled and matches an existing slot, downweight or filter.",
			},
			"behavior-just-created": {
				name: "Just-Created Task Should Not Echo",
				desc: "After creating task T, the recommendation list should not include T itself.",
				anomaly: "If failed: uniqueTitles picks the most recent task as rec source and time enhancement did not collide with the new task.",
				suggestion: "Exclude or heavily downweight task titles whose createdAt is within a small window of contextTime.",
			},
			"behavior-repeated-creation": {
				name: "Repeated Creation Should Not Keep Same Slot",
				desc: "After creating the same task at the same slot 3 times, the 4th recommendation list should not retain that slot.",
				anomaly: "If failed: periodic or historical recommendation did not avoid the slot already used multiple times.",
				suggestion: "Count existing occurrences per title; once a threshold is reached, the next recommendation should move to a new slot.",
			},
			"behavior-accepted-rec": {
				name: "Accepted Recommendation Should Not Reappear",
				desc: "After accepting a recommendation (appended to tasks), regenerating recommendations should not include the same rec.",
				anomaly: "If failed: accepted task enters history but is still used as a recommendation source.",
				suggestion: "In post-processing, exclude titles accepted/created within the last N minutes.",
			},
			"periodic-daily-existing-date": {
				name: "Daily Prediction Avoids Existing Date",
				desc: "With 4 daily morning occurrences, the next predicted date should not be one already scheduled.",
				anomaly: "PeriodicTaskDetector.generateNextOccurrence does not check whether the predicted date already exists as an occurrence.",
				suggestion: "In generateNextOccurrence, skip dates already in occurrences and advance forward until a new date is found.",
			},
			"periodic-weekly-existing-date": {
				name: "Weekly Prediction Avoids Existing Date",
				desc: "With 4 Monday occurrences, the next prediction should not land on an existing Monday.",
				anomaly: "The weekly branch's daysToAdd<=0 +=7 may land on the next Monday that already exists.",
				suggestion: "The weekly branch also needs to filter out existing occurrence dates.",
			},
			"boundary-empty": {
				name: "Empty Task List Boundary",
				desc: "With no initial tasks, creating the first task should not crash and should produce no duplicate rec.",
				anomaly: "If failed: empty list caused divide-by-zero or undefined access.",
				suggestion: "Explicitly return empty recommendations when tasks.length===0.",
			},
			"boundary-single-task": {
				name: "Single Task List Boundary",
				desc: "With one initial task, creating a same-title different-date task should not produce a same-date collision.",
				anomaly: "If failed: insufficient samples still produce a recommendation.",
				suggestion: "Reduce confidence or skip historical recommendation generation when sample size is insufficient.",
			},
			"boundary-past-due": {
				name: "Past Due Date",
				desc: "New task has dueDate in the past. Engine should not crash and should not recommend a duplicate.",
				anomaly: "If failed: past dueDate caused differenceInDays anomaly or inverted recommendation time.",
				suggestion: "Explicitly filter or normalize tasks whose dueDate < contextTime before recommendation.",
			},
		},
	},
} as const;

export type Translations = {
	readonly appName: string;
	readonly appTagline: string;
	readonly nav: {
		readonly home: string;
		readonly calendar: string;
		readonly todo: string;
		readonly note: string;
		readonly customLayout: string;
		readonly stats: string;
		readonly settings: string;
	};
	readonly common: {
		readonly save: string;
		readonly cancel: string;
		readonly delete: string;
		readonly edit: string;
		readonly add: string;
		readonly confirm: string;
		readonly close: string;
		readonly minimize: string;
		readonly maximize: string;
		readonly restore: string;
		readonly noData: string;
		readonly loading: string;
		readonly success: string;
		readonly error: string;
		readonly optional: string;
		readonly required: string;
		readonly all: string;
		readonly today: string;
		readonly tomorrow: string;
		readonly yesterday: string;
		readonly select: string;
		readonly selectAll: string;
		readonly clearSelection: string;
		readonly skip: string;
		readonly reset: string;
		readonly result: string;
	};
	readonly dashboard: {
		readonly title: string;
		readonly greeting: (name?: string) => string;
		readonly summary: string;
		readonly completed: string;
		readonly total: string;
		readonly tasks: string;
		readonly backToNow: string;
		readonly allDayEvents: string;
		readonly noTasksToday: string;
		readonly noAllDayEvents: string;
		readonly clickToCreate: string;
		readonly progressLabel: (done: number, total: number) => string;
	};
	readonly task: {
		readonly new: string;
		readonly edit: string;
		readonly title: string;
		readonly titlePlaceholder: string;
		readonly date: string;
		readonly dueDate: string;
		readonly startTime: string;
		readonly endTime: string;
		readonly allDay: string;
		readonly tags: string;
		readonly tagsPlaceholder: string;
		readonly newTag: string;
		readonly repeatRule: string;
		readonly notes: string;
		readonly notesPlaceholder: string;
		readonly status: string;
		readonly markComplete: string;
		readonly markSkip: string;
		readonly markPending: string;
		readonly deleteConfirm: string;
		readonly deleteConfirmTitle: string;
		readonly deleteAllRepeat: string;
		readonly deleteOptions: string;
		readonly noTags: string;
		readonly dateOrDueDateRequired: string;
		readonly advancedOptions: string;
		readonly dueDateOffset: string;
		readonly dueDateOffsetDesc: string;
		readonly days: string;
		readonly deleteOptionOnlyThis: string;
		readonly deleteOptionAll: string;
		readonly deleteOptionFuture: string;
		readonly deleteOptionPending: string;
		readonly minutesLeft: string;
		readonly unscheduled: string;
		readonly untagged: string;
		readonly multiStep: string;
		readonly stepTitle: string;
		readonly addStep: string;
		readonly deleteStep: string;
		readonly viewFutureTasks: string;
		readonly today: string;
		readonly tomorrow: string;
		readonly notesSyncTitle: string;
		readonly notesSyncConfirm: string;
		readonly notesSyncOptions: string;
		readonly notesSyncOnlyThis: string;
		readonly notesSyncAll: string;
		readonly notesSyncFuture: string;
		readonly notesSyncPending: string;
		readonly historySuggestTitle: string;
		readonly historySuggestTabHint: string;
		readonly historySuggestCount: (n: number) => string;
	};
	readonly status: {
		readonly pending: string;
		readonly completed: string;
		readonly skipped: string;
	};
	readonly repeat: {
		readonly label: string;
		readonly none: string;
		readonly daily: string;
		readonly workdays: string;
		readonly weekly: string;
		readonly monthly: string;
		readonly yearly: string;
		readonly custom: string;
		readonly customEvery: string;
		readonly customDays: string;
		readonly customWeeks: string;
		readonly customMonths: string;
		readonly customYears: string;
		readonly endDate: string;
		readonly endDatePlaceholder: string;
		readonly weekdays: string;
		readonly generating: string;
	};
	readonly calendarSettings: {
		readonly title: string;
		readonly timeRange: string;
		readonly startTime: string;
		readonly endTime: string;
		readonly timeSnap: string;
		readonly timeSnapDesc: string;
		readonly snapEnabled: string;
		readonly snapEnabledDesc: string;
		readonly snapThreshold: string;
		readonly snapThresholdDesc: string;
		readonly rowHeight: string;
		readonly hourDivisions: string;
		readonly divisions: string;
	};
	readonly weekdays: {
		readonly 0: string;
		readonly 1: string;
		readonly 2: string;
		readonly 3: string;
		readonly 4: string;
		readonly 5: string;
		readonly 6: string;
		readonly full: readonly string[];
		readonly short: readonly string[];
	};
	readonly calendar: {
		readonly title: string;
		readonly week: string;
		readonly month: string;
		readonly prevWeek: string;
		readonly nextWeek: string;
		readonly prevMonth: string;
		readonly nextMonth: string;
		readonly today: string;
		readonly thisWeek: string;
		readonly thisMonth: string;
		readonly undo: string;
		readonly redo: string;
		readonly selectMode: string;
		readonly exitSelectMode: string;
		readonly batchDelete: string;
		readonly batchMove: string;
		readonly batchTag: string;
		readonly selected: (n: number) => string;
		readonly noTasksWeek: string;
		readonly allDay: string;
		readonly weekOf: (d: string) => string;
		readonly smartReminder: string;
		readonly smartReminderTooltip: (count: number) => string;
		readonly noPendingDueTasks: string;
		readonly dueTasksCount: (count: number) => string;
		readonly dueSoon: string;
		readonly overdue: string;
	};
	readonly dateNote: {
		readonly title: string;
		readonly addNote: string;
		readonly editNote: string;
		readonly placeholder: string;
		readonly delete: string;
		readonly deleteConfirm: string;
		readonly noNote: string;
		readonly save: string;
		readonly cancel: string;
	};
	readonly stats: {
		readonly title: string;
		readonly timeRange: string;
		readonly day: string;
		readonly week: string;
		readonly month: string;
		readonly custom: string;
		readonly from: string;
		readonly to: string;
		readonly tagBreakdown: string;
		readonly tagBreakdownDesc: string;
		readonly noTag: string;
		readonly efficiency: string;
		readonly efficiencyDesc: string;
		readonly thisPeriod: string;
		readonly prevPeriod: string;
		readonly totalFocus: string;
		readonly completedTasks: string;
		readonly streak: string;
		readonly hours: string;
		readonly days: string;
		readonly tasks: string;
		readonly growth: string;
		readonly noData: string;
		readonly noDataDesc: string;
		readonly minutes: string;
		readonly details: string;
	};
	readonly settings: {
		readonly title: string;
		readonly tags: string;
		readonly tagsDesc: string;
		readonly addTag: string;
		readonly editTag: string;
		readonly deleteTag: string;
		readonly tagName: string;
		readonly tagNamePlaceholder: string;
		readonly tagColor: string;
		readonly tagDeleteConfirm: string;
		readonly activeTags: string;
		readonly archivedTags: string;
		readonly archivedTagsHint: string;
		readonly archiveTag: string;
		readonly restoreTag: string;
		readonly notifications: string;
		readonly notificationsDesc: string;
		readonly notificationsDescWeb: string;
		readonly enableNotifications: string;
		readonly notificationsGranted: string;
		readonly notificationsDenied: string;
		readonly notificationsDeniedWeb: string;
		readonly notificationsDeniedAlert: string;
		readonly notificationsDefault: string;
		readonly notificationTitle: string;
		readonly notificationTitleAdvance: string;
		readonly notificationTitleEnd: string;
		readonly advanceNotification: string;
		readonly advanceNotificationDesc: string;
		readonly never: string;
		readonly minutes: string;
		readonly showStartNotification: string;
		readonly showStartNotificationDesc: string;
		readonly showEndNotification: string;
		readonly showEndNotificationDesc: string;
		readonly language: string;
		readonly languageDesc: string;
		readonly zh: string;
		readonly en: string;
		readonly closeBehavior: string;
		readonly closeBehaviorDesc: string;
		readonly closeBehaviorExit: string;
		readonly closeBehaviorTray: string;
		readonly autoLaunch: string;
		readonly autoLaunchDesc: string;
		readonly dataManagement: string;
		readonly export: string;
		readonly exportDesc: string;
		readonly import: string;
		readonly importDesc: string;
		readonly importDialogTitle: string;
		readonly importMode: string;
		readonly importMergeTitle: string;
		readonly importMergeDesc: string;
		readonly importOverwriteTitle: string;
		readonly importOverwriteDesc: string;
		readonly importConfirm: string;
		readonly importFileVersion: string;
		readonly importFileDate: string;
		readonly importSuccess: string;
		readonly importError: string;
		readonly exportSuccess: string;
		readonly importSelectItems: string;
		readonly selectAll: string;
		readonly deselectAll: string;
		readonly importTasks: string;
		readonly importTags: string;
		readonly importDateNotes: string;
		readonly importNotes: string;
		readonly importNoteLines: string;
		readonly importSettings: string;
		readonly importPomodoro: string;
		readonly about: string;
		readonly aboutDesc: string;
		readonly versionPrefix: string;
		readonly madeWith: string;
		readonly author: string;
		readonly officialWebsite: string;
		readonly sponsor: string;
		readonly otherProjects: string;
		readonly otherProjectsDesc: string;
		readonly econgrapher: string;
		readonly econgrapherDesc: string;
		readonly econgrapherTag: string;
		readonly gpaCalculator: string;
		readonly gpaCalculatorDesc: string;
		readonly gpaCalculatorTag: string;
		readonly teamsCrypt: string;
		readonly teamsCryptDesc: string;
		readonly teamsCryptTag: string;
		readonly canvaHelper: string;
		readonly canvaHelperDesc: string;
		readonly canvaHelperTag: string;
		readonly sound: string;
		readonly soundDesc: string;
		readonly enableSound: string;
		readonly playOnTaskStart: string;
		readonly playOnTaskEnd: string;
		readonly playOnTaskComplete: string;
		readonly playOnTaskDrag: string;
		readonly taskTitleSuggest: string;
		readonly taskTitleSuggestDesc: string;
		readonly startupPage: string;
		readonly startupPageDesc: string;
		readonly startupPageHome: string;
		readonly startupPageCalendar: string;
		readonly startupPageTodo: string;
		readonly startupPageNote: string;
		readonly startupPageStats: string;
		readonly startupPageSettings: string;
		readonly checkUpdate: string;
		readonly updateAvailable: string;
		readonly updateLatest: string;
		readonly updateError: string;
		readonly updateDownloading: string;
		readonly updateInstalled: string;
		readonly updateChecking: string;
		readonly checking: string;
		readonly updateNetworkError: string;
		readonly updateTimeoutError: string;
		readonly general: string;
		readonly clickToStartUpdate: string;
	};
	readonly update: {
		readonly updateAvailable: string;
		readonly updateDesc: string;
		readonly updateNow: string;
		readonly remindLater: string;
		readonly skipThisVersion: string;
		readonly downloading: string;
		readonly clickToStartUpdate: string;
	};
	readonly batch: {
		readonly title: string;
		readonly delete: string;
		readonly deleteConfirm: (n: number) => string;
		readonly move: string;
		readonly moveDate: string;
	};
	readonly pomodoro: {
		readonly title: string;
		readonly start: string;
		readonly pause: string;
		readonly resume: string;
		readonly reset: string;
		readonly stop: string;
		readonly work: string;
		readonly shortBreak: string;
		readonly longBreak: string;
		readonly startPomodoro: string;
		readonly session: string;
		readonly sessions: string;
		readonly completed: string;
		readonly complete: string;
		readonly of: string;
		readonly nextPhase: string;
		readonly fullscreen: string;
		readonly exitFullscreen: string;
		readonly workDuration: string;
		readonly shortBreakDuration: string;
		readonly longBreakDuration: string;
		readonly workSessionsBeforeLongBreak: string;
		readonly autoStartBreaks: string;
		readonly autoStartWork: string;
		readonly currentTask: string;
		readonly noActiveTask: string;
		readonly focusNow: string;
		readonly skipBreaks: string;
		readonly settingsDesc: string;
		readonly quickCreateTask: string;
		readonly breaks: string;
		readonly actualEnd: string;
		readonly scheduledEnd: string;
		readonly focusDuration: string;
		readonly focusComplete: string;
		readonly continueFocus: string;
		readonly startLongBreak: string;
		readonly summary: string;
		readonly minutes: string;
		readonly skip: string;
		readonly continue: string;
		readonly break: string;
		readonly phase: string;
		readonly bindTaskToFocus: string;
		readonly selectTask: string;
		readonly createNewTask: string;
		readonly noTaskBinding: string;
		readonly taskBindingComplete: string;
		readonly manualStop: string;
		readonly manualStopDesc: string;
		readonly writeToTask: string;
		readonly skipWriteToTask: string;
		readonly searchTask: string;
		readonly filterByTag: string;
		readonly noDate: string;
		readonly today: string;
		readonly tomorrow: string;
		readonly thisWeek: string;
		readonly future: string;
		readonly noMatchingTask: string;
		readonly focusDurationDetail: (minutes: number, seconds: number) => string;
		readonly pomodoroCount: (count: number) => string;
		readonly allDay: string;
		readonly due: string;
		readonly overdue: string;
		readonly dueSoon: string;
		readonly pendingStatus: string;
	};
	readonly todo: {
		readonly title: string;
		readonly subtitle: string;
		readonly viewMode: {
			readonly label: string;
			readonly byDate: string;
			readonly byDueDate: string;
		};
		readonly timeFilter: {
			readonly label: string;
			readonly all: string;
			readonly today: string;
			readonly week: string;
			readonly month: string;
			readonly overdue: string;
			readonly upcoming: string;
		};
		readonly statusFilter: {
			readonly label: string;
			readonly all: string;
			readonly pending: string;
			readonly completed: string;
			readonly skipped: string;
		};
		readonly tagFilter: {
			readonly label: string;
			readonly all: string;
		};
		readonly sortBy: {
			readonly label: string;
			readonly date: string;
			readonly time: string;
			readonly title: string;
			readonly status: string;
		};
		readonly sortOrder: {
			readonly label: string;
			readonly asc: string;
			readonly desc: string;
		};
		readonly groupBy: {
			readonly label: string;
			readonly none: string;
			readonly date: string;
			readonly status: string;
			readonly tag: string;
		};
		readonly allDayEvents: string;
		readonly scheduledTasks: string;
		readonly noTasks: string;
		readonly noTasksDesc: string;
		readonly addTask: string;
		readonly completedCount: (done: number, total: number) => string;
	};
	readonly note: {
		readonly title: string;
		readonly subtitle: string;
		readonly newNote: string;
		readonly editNote: string;
		readonly deleteNote: string;
		readonly deleteConfirm: string;
		readonly markComplete: string;
		readonly markActive: string;
		readonly titlePlaceholder: string;
		readonly contentPlaceholder: string;
		readonly noNotes: string;
		readonly noNotesDesc: string;
		readonly quickNote: string;
		readonly quickNoteTitle: string;
		readonly placeholder: string;
		readonly quickNotePlaceholder: string;
		readonly savedSuccessfully: string;
		readonly pleaseEnterContent: string;
		readonly shortcutKeyHint: string;
		readonly shortcutKey: string;
		readonly keyboardShortcut: string;
		readonly captureThoughts: string;
		readonly quickSearch: string;
		readonly searchDescription: string;
		readonly searchPlaceholder: string;
		readonly jumpToNote: string;
		readonly tryDifferentKeywords: string;
		readonly navigate: string;
		readonly jump: string;
		readonly untitled: string;
		readonly save: string;
		readonly colors: {
			readonly yellow: string;
			readonly pink: string;
			readonly blue: string;
			readonly green: string;
			readonly purple: string;
			readonly orange: string;
		};
		readonly toolbar: {
			readonly bold: string;
			readonly italic: string;
			readonly underline: string;
			readonly strikethrough: string;
			readonly fontSize: string;
			readonly textColor: string;
			readonly bulletList: string;
			readonly numberedList: string;
			readonly alignLeft: string;
			readonly alignCenter: string;
			readonly alignRight: string;
		};
		readonly prevDay: string;
		readonly nextDay: string;
		readonly today: string;
		readonly completed: string;
		readonly active: string;
		readonly line: {
			readonly editLine: string;
			readonly deleteLine: string;
			readonly deleteLineConfirm: string;
			readonly lineType: string;
			readonly lineColor: string;
			readonly straight: string;
			readonly arrow: string;
			readonly viewConnections: string;
			readonly noConnections: string;
		};
	};
	readonly tray: {
		readonly show: string;
		readonly hide: string;
		readonly addTask: string;
		readonly pomodoro: string;
		readonly startFocus: string;
		readonly stopFocus: string;
		readonly shortBreak: string;
		readonly longBreak: string;
		readonly focusMode: string;
		readonly enterFocusMode: string;
		readonly exitFocusMode: string;
		readonly settings: string;
		readonly checkUpdate: string;
		readonly visitWebsite: string;
		readonly contactUs: string;
		readonly quit: string;
		readonly tooltip: string;
	};
	readonly timeline: {
		readonly newDay: string;
		readonly dayEnd: string;
		readonly clickToAddTask: string;
	};
	readonly progress: {
		readonly todayProgress: string;
		readonly completed: string;
		readonly noTasksToday: string;
		readonly progressLabel: (done: number, total: number) => string;
	};
	readonly currentTask: {
		readonly focusing: string;
		readonly paused: string;
		readonly inProgress: string;
		readonly upcoming: string;
		readonly focus: string;
		readonly noCurrentTask: string;
	};
	readonly customLayout: {
		readonly widgets: string;
		readonly openWidgetPanel: string;
		readonly switchLayout: string;
		readonly more: string;
		readonly exportLayout: string;
		readonly importLayout: string;
		readonly newLayout: string;
		readonly layoutName: string;
		readonly enterLayoutName: string;
		readonly width: string;
		readonly height: string;
		readonly max: string;
		readonly default: string;
		readonly sizeNote: string;
		readonly cancel: string;
		readonly create: string;
		readonly pasteLayoutJson: string;
		readonly import: string;
		readonly rename: string;
		readonly copy: string;
		readonly delete: string;
		readonly customLayout: string;
		readonly clickToEditTitle: string;
		readonly layers: string;
		readonly layerManager: string;
		readonly noWidgets: string;
		readonly save: string;
		readonly emptyCanvas: string;
		readonly dragWidgetHere: string;
		readonly releaseToAdd: string;
		readonly restoreDefault: string;
		readonly searchWidgets: string;
		readonly noWidgetsFound: string;
	};
	readonly dateRangePicker: {
		readonly title: string;
		readonly description: string;
		readonly selected: string;
		readonly selecting: string;
		readonly clickToEdit: string;
		readonly editTitle: string;
		readonly editDescription: string;
		readonly date: string;
		readonly startTime: string;
		readonly endTime: string;
	};
	readonly widgets: {
		readonly calculator: string;
		readonly history: string;
		readonly spinWheel: string;
		readonly options: string;
		readonly option: string;
		readonly addOption: string;
		readonly spin: string;
		readonly quote: string;
		readonly refresh: string;
		readonly copy: string;
		readonly timer: string;
		readonly countdown: string;
		readonly stopwatch: string;
		readonly start: string;
		readonly pause: string;
		readonly reset: string;
		readonly hours: string;
		readonly minutes: string;
		readonly seconds: string;
		readonly preset: string;
		readonly search: string;
		readonly searchPlaceholder: string;
		readonly searchHistory: string;
		readonly clearHistory: string;
		readonly todo: string;
		readonly addTask: string;
		readonly noTasks: string;
		readonly note: string;
		readonly placeholder: string;
		readonly pomodoro: string;
		readonly focus: string;
		readonly shortBreak: string;
		readonly longBreak: string;
		readonly progress: string;
		readonly currentTask: string;
		readonly noCurrentTask: string;
		readonly datetime: string;
		readonly timeline: string;
		readonly countdownWidget: string;
		readonly targetDate: string;
		readonly daysLeft: string;
		readonly textWidget: string;
		readonly lineWidget: string;
	};

	readonly smartRecommendTest: {
		readonly title: string;
		readonly description: string;
		readonly acceptRate: string;
		readonly avgConfidence: string;
		readonly noveltyRate: string;
		readonly historicalTasks: string;
		readonly forPatternLearning: string;
		readonly analysisOverview: string;
		readonly timeRelationPatterns: string;
		readonly periodicPatterns: string;
		readonly predictedTasks: string;
		readonly dynamicRules: string;
		readonly tabRecommend: string;
		readonly tabTest: string;
		readonly tabLogs: string;
		readonly createTask: string;
		readonly resetData: string;
		readonly exportData: string;
		readonly exportDataDesc: string;
		readonly importData: string;
		readonly importDataDesc: string;
		readonly exportSuccess: string;
		readonly importSuccess: string;
		readonly importError: string;
		readonly selectImportMode: string;
		readonly importMerge: string;
		readonly importMergeDesc: string;
		readonly importOverwrite: string;
		readonly importOverwriteDesc: string;
		readonly importFileVersion: string;
		readonly importFileDate: string;
		readonly importConfirm: string;
		readonly importItems: string;
		readonly importTasksCount: (n: number) => string;
		readonly importFeedbacksCount: (n: number) => string;
		readonly importLogsCount: (n: number) => string;
		readonly noDataToExport: string;
	};

	readonly duplicateTest: {
		readonly title: string;
		readonly description: string;
		readonly runAll: string;
		readonly reset: string;
		readonly runSingle: string;
		readonly rerun: string;
		readonly statusPending: string;
		readonly statusPassed: string;
		readonly statusFailed: string;
		readonly catAll: string;
		readonly catExact: string;
		readonly catNear: string;
		readonly catBehavior: string;
		readonly catPeriodic: string;
		readonly catBoundary: string;
		readonly expected: string;
		readonly actual: string;
		readonly diff: string;
		readonly anomalyAnalysis: string;
		readonly optimizationSuggestion: string;
		readonly passRate: string;
		readonly summary: string;
		readonly scenarioList: string;
		readonly report: string;
		readonly flaggedCount: string;
		readonly noRecommendations: string;
		readonly matchedCriteria: string;
		readonly initialTasks: string;
		readonly contextTimeLabel: string;
		readonly createdTask: string;
		readonly commonPatterns: string;
		readonly prioritizedSuggestions: string;
		readonly noReport: string;
		readonly noResults: string;
		readonly runHint: string;
		readonly scenarios: {
			readonly "exact-same-time": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "exact-all-day": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "exact-multiple": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "near-diff-time": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "near-diff-date": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "near-whitespace-case": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "near-missing-time": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "behavior-just-created": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "behavior-repeated-creation": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "behavior-accepted-rec": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "periodic-daily-existing-date": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "periodic-weekly-existing-date": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "boundary-empty": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "boundary-single-task": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
			readonly "boundary-past-due": { readonly name: string; readonly desc: string; readonly anomaly: string; readonly suggestion: string };
		};
	};
};

export const translations: Record<Language, Translations> = { zh, en };

export function useTranslations(lang: Language): Translations {
	return translations[lang] ?? translations.zh;
}
