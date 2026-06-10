import pandas as pd
import webbrowser
import pyautogui
import time
import sys
import os

# --- 配置部分 ---
# CSV 文件路径
CSV_FILE_PATH = 'urls.csv'
# 快捷键组合 (根据您的 Obsidian 插件设置修改)
# 例如: 'command', 'shift', 'e' (Mac) 或 'ctrl', 'shift', 'e' (Windows/Linux)
# 假设 Obsidian Web Clipper 的快捷键是 Cmd+Shift+K
SHORTCUT_KEYS = ['command', 'shift', 'k']

# 延迟设置 (单位: 秒)
PAGE_LOAD_DELAY = 5    # 等待网页加载的时间
CLIP_ACTION_DELAY = 2  # 等待剪藏动作完成的时间
BROWSER_OPEN_DELAY = 1 # 打开浏览器后的短暂等待

def process_urls():
    """
    读取 CSV 文件并处理每个 URL。
    """
    # 检查 CSV 文件是否存在
    if not os.path.exists(CSV_FILE_PATH):
        print(f"错误: 找不到文件 {CSV_FILE_PATH}")
        return

    try:
        # 读取 CSV
        df = pd.read_csv(CSV_FILE_PATH)
        
        # 检查是否包含 'urls' 列
        if 'urls' not in df.columns:
            print("错误: CSV 文件中未找到 'urls' 列")
            return

        urls = df['urls'].dropna().tolist()
        total_urls = len(urls)
        
        print(f"开始处理 {total_urls} 个 URL...")
        print("-" * 50)

        for index, url in enumerate(urls):
            current_num = index + 1
            print(f"[{current_num}/{total_urls}] 正在处理: {url}")
            
            try:
                # 1. 打开 URL
                print("  -> 打开浏览器...")
                webbrowser.open(url)
                
                # 等待浏览器响应
                time.sleep(BROWSER_OPEN_DELAY)
                
                # 2. 等待网页加载
                print(f"  -> 等待网页加载 ({PAGE_LOAD_DELAY}秒)...")
                time.sleep(PAGE_LOAD_DELAY)
                
                # 3. 执行快捷键
                shortcut_str = '+'.join(SHORTCUT_KEYS)
                print(f"  -> 执行剪藏快捷键 ({shortcut_str})...")
                
                # 在 macOS 上通常使用 command，Windows 使用 ctrl
                # pyautogui.hotkey 自动处理多键按下和释放
                pyautogui.hotkey(*SHORTCUT_KEYS)
                
                # 4. 等待剪藏动作完成
                print(f"  -> 等待剪藏完成 ({CLIP_ACTION_DELAY}秒)...")
                time.sleep(CLIP_ACTION_DELAY)
                
                # 可选：处理完后关闭当前标签页 (Command + w)
                # print("  -> 关闭当前标签页...")
                # pyautogui.hotkey('command', 'w')
                # time.sleep(0.5)

                print("  -> 完成")
                
            except Exception as e:
                print(f"  -> 处理出错: {e}")
            
            print("-" * 50)

        print("所有 URL 处理完毕！")

    except Exception as e:
        print(f"发生意外错误: {e}")

if __name__ == "__main__":
    # 提示用户关于辅助功能权限
    print("注意: 在 macOS 上，您需要授予终端或 IDE '辅助功能' (Accessibility) 权限，")
    print("否则 pyautogui 无法模拟按键。")
    print("请确保已在 系统设置 -> 隐私与安全性 -> 辅助功能 中勾选了您的终端/IDE。\n")
    
    # 给用户一点时间确认
    time.sleep(2)
    
    process_urls()
