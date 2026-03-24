use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{LazyLock, RwLock};
use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Wry,
};

mod keyboard_hook;

pub static FOCUS_MODE_ACTIVE: AtomicBool = AtomicBool::new(false);
pub static CLOSE_BEHAVIOR: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new(String::from("exit")));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayMenuState {
    pub pomodoro_running: bool,
    pub pomodoro_phase: String,
    pub focus_mode_active: bool,
    pub window_visible: bool,
}

pub struct TrayMenuItems {
    pub show_item: MenuItem<Wry>,
    pub hide_item: MenuItem<Wry>,
    pub start_focus_item: MenuItem<Wry>,
    pub stop_focus_item: MenuItem<Wry>,
    pub short_break_item: MenuItem<Wry>,
    pub long_break_item: MenuItem<Wry>,
    pub enter_focus_mode_item: MenuItem<Wry>,
    pub exit_focus_mode_item: MenuItem<Wry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
    pub app_name: String,
    pub app_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileDialogOptions {
    pub title: Option<String>,
    pub default_path: Option<String>,
    pub filters: Option<Vec<FileFilter>>,
    pub multiple: Option<bool>,
}

pub fn get_platform_info_impl(app: &AppHandle) -> PlatformInfo {
    PlatformInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: os_info::get().version().to_string(),
        app_name: app.config().identifier.clone(),
        app_version: app.config().version.clone().unwrap_or_else(|| "1.0.0".to_string()),
    }
}

pub fn show_notification_impl(app: &AppHandle, title: &str, body: &str) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_auto_launch_impl(enabled: bool) -> Result<(), String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_path_str = exe_path.to_string_lossy();
    let auto = auto_launch::AutoLaunchBuilder::new()
        .set_app_name("PlanIt")
        .set_app_path(&exe_path_str)
        .set_use_launch_agent(true)
        .build()
        .map_err(|e| e.to_string())?;

    if enabled {
        auto.enable().map_err(|e| e.to_string())?;
    } else {
        auto.disable().map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn get_auto_launch_impl() -> Result<bool, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_path_str = exe_path.to_string_lossy();
    let auto = auto_launch::AutoLaunchBuilder::new()
        .set_app_name("PlanIt")
        .set_app_path(&exe_path_str)
        .set_use_launch_agent(true)
        .build()
        .map_err(|e| e.to_string())?;

    auto.is_enabled().map_err(|e| e.to_string())
}

pub fn open_file_picker_impl(
    app: &AppHandle,
    options: Option<FileDialogOptions>,
) -> Result<Option<Vec<String>>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(opts) = &options {
        if let Some(title) = &opts.title {
            dialog = dialog.set_title(title);
        }
        
        if let Some(path) = &opts.default_path {
            dialog = dialog.set_directory(path);
        }
        
        if let Some(filters) = &opts.filters {
            for filter in filters {
                let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
                dialog = dialog.add_filter(&filter.name, &extensions);
            }
        }
    }
    
    let result = dialog.blocking_pick_files();
    
    match result {
        Some(paths) if options.as_ref().and_then(|o| o.multiple).unwrap_or(false) => {
            Ok(Some(paths.iter().map(|p| p.to_string()).collect()))
        }
        Some(paths) => {
            Ok(paths.first().map(|p| vec![p.to_string()]))
        }
        None => Ok(None),
    }
}

pub fn save_file_picker_impl(
    app: &AppHandle,
    options: Option<FileDialogOptions>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(opts) = &options {
        if let Some(title) = &opts.title {
            dialog = dialog.set_title(title);
        }
        
        if let Some(path) = &opts.default_path {
            dialog = dialog.set_directory(path);
        }
        
        if let Some(filters) = &opts.filters {
            for filter in filters {
                let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
                dialog = dialog.add_filter(&filter.name, &extensions);
            }
        }
    }
    
    let result = dialog.blocking_save_file();
    
    Ok(result.map(|p| p.to_string()))
}

pub fn read_file_impl(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn write_file_impl(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

pub fn write_clipboard_impl(app: &AppHandle, text: &str) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().write_text(text).map_err(|e| e.to_string())
}

pub fn read_clipboard_impl(app: &AppHandle) -> Result<String, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().read_text().map_err(|e| e.to_string())
}

pub fn register_global_shortcut_impl(app: &AppHandle, accelerator: &str) -> Result<bool, String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    
    let accelerator_owned = accelerator.to_string();
    app.global_shortcut()
        .on_shortcut(accelerator, move |_app, _shortcut, _event| {
            if FOCUS_MODE_ACTIVE.load(Ordering::SeqCst) {
                return;
            }
            if let Some(window) = _app.get_webview_window("main") {
                let _ = window.emit("global-shortcut-triggered", &accelerator_owned);
            }
        })
        .map_err(|e| e.to_string())?;
    
    Ok(true)
}

pub fn unregister_global_shortcut_impl(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    
    app.global_shortcut()
        .unregister(accelerator)
        .map_err(|e| e.to_string())
}

pub fn enter_focus_mode_impl(app: &AppHandle) -> Result<(), String> {
    FOCUS_MODE_ACTIVE.store(true, Ordering::SeqCst);
    
    if let Err(e) = keyboard_hook::install_keyboard_hook() {
        eprintln!("Failed to install keyboard hook: {}", e);
    }
    
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_fullscreen(true);
    }
    
    Ok(())
}

pub fn exit_focus_mode_impl(app: &AppHandle) -> Result<(), String> {
    FOCUS_MODE_ACTIVE.store(false, Ordering::SeqCst);
    
    if let Err(e) = keyboard_hook::uninstall_keyboard_hook() {
        eprintln!("Failed to uninstall keyboard hook: {}", e);
    }
    
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_fullscreen(false);
    }
    
    Ok(())
}

pub fn is_focus_mode_active_impl() -> bool {
    FOCUS_MODE_ACTIVE.load(Ordering::SeqCst)
}

pub fn set_close_behavior_impl(behavior: &str) -> Result<(), String> {
    let mut close_behavior = CLOSE_BEHAVIOR.write().map_err(|e| e.to_string())?;
    *close_behavior = behavior.to_string();
    Ok(())
}

pub fn get_close_behavior_impl() -> Result<String, String> {
    let close_behavior = CLOSE_BEHAVIOR.read().map_err(|e| e.to_string())?;
    Ok(close_behavior.clone())
}

pub fn setup_system_tray(app: &AppHandle<Wry>) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "隐藏到托盘", true, None::<&str>)?;
    
    let start_focus_item = MenuItem::with_id(app, "start-focus", "开始专注", true, None::<&str>)?;
    let stop_focus_item = MenuItem::with_id(app, "stop-focus", "停止专注", false, None::<&str>)?;
    let short_break_item = MenuItem::with_id(app, "short-break", "休息5分钟", true, None::<&str>)?;
    let long_break_item = MenuItem::with_id(app, "long-break", "休息15分钟", true, None::<&str>)?;
    let pomodoro_submenu = Submenu::with_items(
        app,
        "番茄钟",
        true,
        &[
            &start_focus_item,
            &stop_focus_item,
            &short_break_item,
            &long_break_item,
        ],
    )?;
    
    let enter_focus_mode_item = MenuItem::with_id(app, "enter-focus-mode", "进入聚焦模式", true, None::<&str>)?;
    let exit_focus_mode_item = MenuItem::with_id(app, "exit-focus-mode", "退出聚焦模式", false, None::<&str>)?;
    let focus_mode_submenu = Submenu::with_items(
        app,
        "聚焦模式",
        true,
        &[
            &enter_focus_mode_item,
            &exit_focus_mode_item,
        ],
    )?;
    
    let settings_item = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let check_update_item = MenuItem::with_id(app, "check-update", "检查更新", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    
    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &hide_item,
            &pomodoro_submenu,
            &focus_mode_submenu,
            &settings_item,
            &check_update_item,
            &quit_item,
        ],
    )?;
    
    let menu_items = TrayMenuItems {
        show_item: show_item.clone(),
        hide_item: hide_item.clone(),
        start_focus_item: start_focus_item.clone(),
        stop_focus_item: stop_focus_item.clone(),
        short_break_item: short_break_item.clone(),
        long_break_item: long_break_item.clone(),
        enter_focus_mode_item: enter_focus_mode_item.clone(),
        exit_focus_mode_item: exit_focus_mode_item.clone(),
    };
    
    app.manage(menu_items);
    
    let _tray = TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("PlanIt - 专注效率")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "start-focus" | "stop-focus" | "short-break" | "long-break" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-pomodoro-action", event.id.as_ref());
                }
            }
            "enter-focus-mode" => {
                FOCUS_MODE_ACTIVE.store(true, Ordering::SeqCst);
                let _ = keyboard_hook::install_keyboard_hook();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_fullscreen(true);
                    let _ = window.emit("focus-mode-changed", true);
                }
            }
            "exit-focus-mode" => {
                FOCUS_MODE_ACTIVE.store(false, Ordering::SeqCst);
                let _ = keyboard_hook::uninstall_keyboard_hook();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_fullscreen(false);
                    let _ = window.emit("focus-mode-changed", false);
                }
            }
            "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("open-settings", ());
                }
            }
            "check-update" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("check-for-updates", ());
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;
    
    Ok(())
}

pub fn update_tray_menu_impl(app: &AppHandle<Wry>, state: TrayMenuState) -> Result<(), String> {
    let menu_items = app.state::<TrayMenuItems>();
    
    let _ = menu_items.show_item.set_enabled(!state.window_visible);
    let _ = menu_items.hide_item.set_enabled(state.window_visible);
    let _ = menu_items.start_focus_item.set_enabled(!state.pomodoro_running);
    let _ = menu_items.stop_focus_item.set_enabled(state.pomodoro_running);
    let _ = menu_items.short_break_item.set_enabled(!state.pomodoro_running);
    let _ = menu_items.long_break_item.set_enabled(!state.pomodoro_running);
    let _ = menu_items.enter_focus_mode_item.set_enabled(!state.focus_mode_active);
    let _ = menu_items.exit_focus_mode_item.set_enabled(state.focus_mode_active);
    
    Ok(())
}
