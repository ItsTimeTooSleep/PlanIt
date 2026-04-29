#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动修复硬编码翻译的脚本
搜索所有文件中的 lang === 'zh' ? ... : ... 模式，并尝试用翻译函数替换
"""

import os
import re
import sys
from pathlib import Path


# 设置标准输出为 UTF-8 编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class TranslationFixer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.i18n_path = self.project_root / "lib" / "i18n.ts"
        self.zh_values = {}  # {text: key}
        self.en_values = {}  # {text: key}
        
    def parse_i18n(self):
        """解析 i18n.ts 文件，提取所有翻译"""
        print(f"正在解析 {self.i18n_path}...")
        
        if not self.i18n_path.exists():
            raise FileNotFoundError(f"找不到文件: {self.i18n_path}")
        
        content = self.i18n_path.read_text(encoding='utf-8')
        
        # 解析中文翻译
        self._parse_translations(content, 'zh', self.zh_values)
        
        # 解析英文翻译
        self._parse_translations(content, 'en', self.en_values)
        
        print(f"解析到中文翻译: {len(self.zh_values)} 个")
        print(f"解析到英文翻译: {len(self.en_values)} 个")
    
    def _parse_translations(self, content: str, lang: str, values_dict: dict):
        """解析指定语言的翻译"""
        # 找到翻译对象的开始
        pattern = rf'const {lang} = ({{[\s\S]*?}}) as const'
        match = re.search(pattern, content)
        if not match:
            return
        
        obj_str = match.group(1)
        current_path = []
        brace_count = 0  # 使用计数器追踪嵌套层级
        
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
                continue
            
            # 如果有闭合括号，减少层级
            if close_braces > 0:
                # 对于每一个闭合括号，弹出一个路径段
                for _ in range(close_braces):
                    if current_path:
                        current_path.pop()
                brace_count += open_braces - close_braces
                continue
            
            # 没有对象开始或结束，检查是否是键值对
            brace_count += open_braces - close_braces
            
            # 检查是否是键值对: key: 'value', 或 key: "value",
            key_match = re.match(r'(\w+):\s*[\'"]([^\'"]+)[\'"],?', line)
            if key_match:
                key = key_match.group(1)
                value = key_match.group(2)
                
                # 构建完整的键路径
                full_key = '.'.join(current_path + [key])
                
                # 存储值到键的映射
                values_dict[value] = full_key
                continue
            
            # 检查是否是带逗号的结束键值对
            key_match2 = re.match(r'(\w+):\s*[\'"]([^\'"]+)[\'"]', line)
            if key_match2:
                key = key_match2.group(1)
                value = key_match2.group(2)
                full_key = '.'.join(current_path + [key])
                values_dict[value] = full_key
                continue
    
    def find_files(self, extensions: list = None) -> list:
        """查找所有需要检查的文件"""
        if extensions is None:
            extensions = ['.tsx', '.ts']
        
        files = []
        for ext in extensions:
            files.extend(self.project_root.rglob(f"*{ext}"))
        
        # 排除 node_modules、.next、dist 等目录
        excluded_dirs = ['node_modules', '.next', 'dist', 'src-tauri', 'PlanIt-OfficialWebsite', 'design', 'docs', 'hooks', 'icons', 'public', 'styles', 'types']
        filtered_files = []
        for file in files:
            path_str = str(file)
            if any(excluded in path_str for excluded in excluded_dirs):
                continue
            filtered_files.append(file)
        
        return filtered_files
    
    def fix_file(self, file_path: Path) -> int:
        """修复单个文件中的硬编码翻译"""
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # 查找 lang === 'zh' ? ... : ... 模式
        # 模式: lang === 'zh' ? '中文' : 'English'
        pattern = re.compile(
            r'lang\s*===\s*[\'"]zh[\'"]\s*\?\s*[\'"]([^\'"]+)[\'"]\s*:\s*[\'"]([^\'"]+)[\'"]'
        )
        
        replacements = 0
        matches = list(pattern.finditer(content))
        
        if matches:
            print(f"\n文件: {file_path.relative_to(self.project_root)}")
            print(f"  发现 {len(matches)} 个硬编码翻译")
        
        # 反向处理，这样我们就不会干扰索引
        for match in reversed(matches):
            zh_text = match.group(1)
            en_text = match.group(2)
            
            # 尝试找到对应的翻译键
            translation_key = None
            
            # 优先尝试同时匹配中英文
            if zh_text in self.zh_values and en_text in self.en_values:
                key1 = self.zh_values[zh_text]
                key2 = self.en_values[en_text]
                if key1 == key2:
                    translation_key = key1
            
            # 如果失败，尝试只匹配中文
            if not translation_key and zh_text in self.zh_values:
                translation_key = self.zh_values[zh_text]
            
            # 如果失败，尝试只匹配英文
            if not translation_key and en_text in self.en_values:
                translation_key = self.en_values[en_text]
            
            if translation_key:
                # 替换为 t.xxx
                new_text = f't.{translation_key}'
                content = content[:match.start()] + new_text + content[match.end():]
                replacements += 1
                print(f"    [OK] 替换: '{zh_text}'/'{en_text}' -> t.{translation_key}")
            else:
                print(f"    [WARN] 未找到翻译: '{zh_text}'/'{en_text}'")
        
        if replacements > 0:
            file_path.write_text(content, encoding='utf-8')
            print(f"  修复了 {replacements} 处")
        
        return replacements
    
    def run(self):
        """运行修复"""
        print("=" * 60)
        print("PlanIt 自动翻译修复工具")
        print("=" * 60)
        
        # 解析翻译文件
        self.parse_i18n()
        
        # 查找文件
        print("\n正在查找文件...")
        files = self.find_files()
        print(f"找到 {len(files)} 个文件需要检查")
        
        # 逐个修复
        total_replacements = 0
        for file_path in files:
            try:
                replacements = self.fix_file(file_path)
                total_replacements += replacements
            except Exception as e:
                print(f"\n[ERROR] 处理文件 {file_path} 时出错: {e}")
        
        print("\n" + "=" * 60)
        print(f"修复完成！共修复 {total_replacements} 处")
        print("=" * 60)


def main():
    project_root = Path(__file__).parent.parent
    fixer = TranslationFixer(project_root)
    fixer.run()


if __name__ == "__main__":
    main()
