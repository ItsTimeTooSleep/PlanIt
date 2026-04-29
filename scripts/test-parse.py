#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试解析 i18n.ts
"""

import re
from pathlib import Path

i18n_path = Path(__file__).parent.parent / "lib" / "i18n.ts"
content = i18n_path.read_text(encoding='utf-8')

# 找到中文翻译对象
zh_match = re.search(r'const zh = ({[\s\S]*?}) as const', content)
if zh_match:
    obj_str = zh_match.group(1)
    current_path = []
    brace_count = 0
    
    print("解析中文翻译...")
    print("=" * 60)
    
    # 逐行处理
    lines = obj_str.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        
        # 跳过空行和注释
        if not line or line.startswith('//'):
            continue
        
        # 计算这一行的括号数量变化
        open_braces = line.count('{')
        close_braces = line.count('}')
        
        # 检查是否是对象开始: key: {
        obj_start_match = re.match(r'(\w+):\s*\{', line)
        if obj_start_match:
            key = obj_start_match.group(1)
            current_path.append(key)
            brace_count += open_braces - close_braces
            print(f"进入对象: {'.'.join(current_path)}")
            continue
        
        # 如果有闭合括号，减少层级
        if close_braces > 0:
            # 对于每一个闭合括号，弹出一个路径段
            for _ in range(close_braces):
                if current_path:
                    print(f"离开对象: {'.'.join(current_path)}")
                    current_path.pop()
            brace_count += open_braces - close_braces
            continue
        
        # 没有对象开始或结束
        brace_count += open_braces - close_braces
        
        # 检查是否是键值对: key: 'value', 或 key: "value",
        key_match = re.match(r'(\w+):\s*[\'"]([^\'"]+)[\'"],?', line)
        if key_match:
            key = key_match.group(1)
            value = key_match.group(2)
            full_key = '.'.join(current_path + [key])
            print(f"  {full_key} = '{value}'")
            continue
        
        # 检查是否是带逗号的结束键值对
        key_match2 = re.match(r'(\w+):\s*[\'"]([^\'"]+)[\'"]', line)
        if key_match2:
            key = key_match2.group(1)
            value = key_match2.group(2)
            full_key = '.'.join(current_path + [key])
            print(f"  {full_key} = '{value}'")
            continue
