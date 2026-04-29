#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Microsoft To Do 到 PlanIt 数据转换脚本

该脚本用于将从 Microsoft To Do 导出的 JSON 数据转换为 PlanIt 应用可导入的格式。

功能：
1. 读取 Microsoft To Do 导出的 data.json 文件
2. 根据 listName 智能创建标签：
   - 包含 emoji 的 listName（如 "🙏 English Literature"）创建同名标签
   - "任务" listName 创建 "Other" 标签
   - "✅ Finished" 等状态类 listName 不创建标签
3. 转换任务格式并关联标签
4. 输出 PlanIt 可导入的 JSON 文件

参数：
    input_file: Microsoft To Do 导出的 JSON 文件路径（默认：data.json）
    output_file: PlanIt 导入文件输出路径（默认：planit-import.json）

返回值：
    无（直接输出 JSON 文件）

异常：
    FileNotFoundError: 输入文件不存在
    json.JSONDecodeError: JSON 解析失败
    KeyError: 缺少必要字段
"""

import json
import uuid
import re
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from pathlib import Path


def contains_emoji(text: str) -> bool:
    """
    检查字符串是否包含 emoji 表情
    
    参数：
        text: 要检查的字符串
    
    返回值：
        bool: 如果包含 emoji 返回 True，否则返回 False
    """
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"
        "\U0001FA00-\U0001FA6F"
        "\U0001FA70-\U0001FAFF"
        "\U00002600-\U000026FF"
        "\U00002700-\U000027BF"
        "]+",
        flags=re.UNICODE
    )
    return bool(emoji_pattern.search(text))


def should_create_tag(list_name: str) -> Tuple[bool, str]:
    """
    判断是否应该为该 listName 创建标签，并返回标签名称
    
    参数：
        list_name: Microsoft To Do 的列表名称
    
    返回值：
        Tuple[bool, str]: (是否创建标签, 标签名称)
    """
    if not list_name:
        return False, ""
    
    if list_name == "任务":
        return True, "Other"
    
    if list_name in ["✅ Finished", "已完成", "Finished"]:
        return False, ""
    
    if contains_emoji(list_name):
        return True, list_name
    
    return False, ""


def generate_color_from_name(name: str) -> str:
    """
    根据名称生成一个稳定的颜色值
    
    参数：
        name: 标签名称
    
    返回值：
        str: 十六进制颜色值（如 "#4F46E5"）
    """
    colors = [
        "#EF4444", "#F97316", "#F59E0B", "#EAB308",
        "#84CC16", "#22C55E", "#10B981", "#14B8A6",
        "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
        "#8B5CF6", "#A855F7", "#D946EF", "#EC4899",
        "#F43F5E"
    ]
    
    hash_value = sum(ord(c) for c in name)
    return colors[hash_value % len(colors)]


def convert_datetime_to_date(datetime_str: str) -> str:
    """
    将 ISO 8601 datetime 字符串转换为 YYYY-MM-DD 格式
    
    参数：
        datetime_str: ISO 8601 格式的日期时间字符串
    
    返回值：
        str: YYYY-MM-DD 格式的日期字符串
    """
    if not datetime_str:
        return ""
    
    try:
        dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except (ValueError, AttributeError):
        return ""


def convert_status(ms_status: str) -> str:
    """
    将 Microsoft To Do 状态转换为 PlanIt 状态
    
    参数：
        ms_status: Microsoft To Do 任务状态
    
    返回值：
        str: PlanIt 任务状态（'pending' 或 'completed'）
    """
    return "completed" if ms_status == "completed" else "pending"


def convert_importance_to_priority(importance: str) -> str:
    """
    将 Microsoft To Do 重要性转换为 PlanIt 优先级（存储在 notes 中）
    
    参数：
        importance: Microsoft To Do 任务重要性（'high', 'normal', 'low'）
    
    返回值：
        str: 优先级描述
    """
    importance_map = {
        "high": "高优先级",
        "normal": "普通",
        "low": "低优先级"
    }
    return importance_map.get(importance, "普通")


def process_microsoft_todo_data(input_file: str) -> Dict:
    """
    处理 Microsoft To Do 数据并转换为 PlanIt 格式
    
    参数：
        input_file: Microsoft To Do 导出的 JSON 文件路径
    
    返回值：
        Dict: PlanIt 格式的数据字典
    
    异常：
        FileNotFoundError: 文件不存在
        json.JSONDecodeError: JSON 解析失败
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        ms_todo_data = json.load(f)
    
    tags_dict: Dict[str, Dict] = {}
    tasks: List[Dict] = []
    tag_name_to_id: Dict[str, str] = {}
    
    for list_item in ms_todo_data:
        if not isinstance(list_item, dict) or 'tasks' not in list_item:
            continue
        
        tasks_in_list = list_item.get('tasks', [])
        
        for task in tasks_in_list:
            if not isinstance(task, dict):
                continue
            
            list_name = task.get('listName', '')
            
            should_create, tag_name = should_create_tag(list_name)
            
            if should_create and tag_name and tag_name not in tag_name_to_id:
                tag_id = str(uuid.uuid4())
                tag_name_to_id[tag_name] = tag_id
                tags_dict[tag_id] = {
                    "id": tag_id,
                    "name": tag_name,
                    "color": generate_color_from_name(tag_name)
                }
            
            task_id = str(uuid.uuid4())
            due_date = convert_datetime_to_date(task.get('dueDateTime', ''))
            
            task_tag_ids = []
            if should_create and tag_name and tag_name in tag_name_to_id:
                task_tag_ids = [tag_name_to_id[tag_name]]
            
            notes_parts = []
            if task.get('notes'):
                notes_parts.append(task['notes'])
            
            importance = task.get('importance', 'normal')
            if importance != 'normal':
                notes_parts.append(f"[{convert_importance_to_priority(importance)}]")
            
            notes_str = '\n'.join(notes_parts) if notes_parts else ""
            
            created_datetime = task.get('createdDateTime', '')
            if not created_datetime:
                created_datetime = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            
            planit_task = {
                "id": task_id,
                "title": task.get('title', 'Untitled'),
                "date": due_date,
                "dueDate": due_date,
                "isAllDay": True,
                "tagIds": task_tag_ids,
                "repeatRule": {
                    "frequency": "none"
                },
                "notes": notes_str,
                "status": convert_status(task.get('status', 'notStarted')),
                "createdAt": created_datetime
            }
            
            tasks.append(planit_task)
    
    planit_data = {
        "tasks": tasks,
        "tags": list(tags_dict.values()),
        "dateNotes": [],
        "notes": [],
        "noteLines": [],
        "settings": {
            "language": "zh",
            "notifications": {
                "enabled": True,
                "advanceMinutes": None,
                "showStartNotification": True,
                "showEndNotification": True
            },
            "calendar": {
                "dayStartTime": 6,
                "dayEndTime": 22,
                "hourDivisions": 4,
                "hourHeight": 60,
                "timeSnap": 15,
                "snapEnabled": True,
                "snapThreshold": 10
            },
            "closeBehavior": "tray",
            "sound": {
                "enabled": True,
                "playOnTaskStart": True,
                "playOnTaskEnd": True,
                "playOnTaskComplete": True,
                "playOnTaskDrag": False
            },
            "startupPage": "/home"
        },
        "pomodoro": {
            "taskId": None,
            "status": "idle",
            "phase": "work",
            "remainingSeconds": 1500,
            "totalSeconds": 1500,
            "completedSessions": 0,
            "settings": {
                "workDuration": 25,
                "shortBreakDuration": 5,
                "longBreakDuration": 15,
                "workSessionsBeforeLongBreak": 4,
                "autoStartBreaks": False,
                "autoStartWork": False
            },
            "startTime": None,
            "scheduledEndTime": None,
            "actualEndTime": None,
            "shortBreakCount": 0,
            "longBreakCount": 0
        }
    }
    
    return planit_data


def main():
    """
    主函数：执行转换流程
    
    参数：
        无
    
    返回值：
        无
    """
    import sys
    import io
    
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    input_file = "data.json"
    output_file = "planit-import.json"
    
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"错误：找不到输入文件 '{input_file}'")
        return
    
    print(f"正在读取 {input_file}...")
    
    try:
        planit_data = process_microsoft_todo_data(input_file)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(planit_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n转换成功！")
        print(f"输出文件：{output_file}")
        print(f"任务总数：{len(planit_data['tasks'])}")
        print(f"标签总数：{len(planit_data['tags'])}")
        
        if planit_data['tags']:
            print(f"\n创建的标签：")
            for tag in planit_data['tags']:
                print(f"  - {tag['name']} (颜色: {tag['color']})")
        
        print(f"\n使用方法：")
        print(f"1. 打开 PlanIt 应用")
        print(f"2. 进入 设置 -> 数据管理")
        print(f"3. 点击 '导入数据'")
        print(f"4. 选择文件：{output_file}")
        print(f"5. 选择导入模式（推荐：合并）")
        print(f"6. 确认导入")
        
    except json.JSONDecodeError as e:
        print(f"错误：JSON 解析失败 - {e}")
    except Exception as e:
        print(f"错误：{e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
