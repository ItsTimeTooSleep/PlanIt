#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager};
use planit_lib::{
    enter_focus_mode_impl, exit_focus_mode_impl, get_auto_launch_impl, get_platform_info_impl,
    is_focus_mode_active_impl, open_file_picker_impl, read_clipboard_impl, read_file_impl,
    register_global_shortcut_impl, save_file_picker_impl, set_auto_launch_impl,
    show_notification_impl, unregister_global_shortcut_impl, write_clipboard_impl,
    write_file_impl, set_close_behavior_impl, get_close_behavior_impl, update_tray_menu_impl,
    update_tray_menu_labels_impl,
    FileDialogOptions, PlatformInfo, TrayMenuState, TrayMenuLabels,
};
use tauri_plugin_autostart::MacosLauncher;

#[tauri::command]
async fn get_platform_info(app: tauri::AppHandle) -> PlatformInfo {
    get_platform_info_impl(&app)
}

#[tauri::command]
async fn show_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
    _icon: Option<String>,
    _sound: bool,
) -> Result<(), String> {
    show_notification_impl(&app, &title, &body)
}

#[tauri::command]
async fn set_auto_launch(app: tauri::AppHandle, enabled: bool, _minimized: bool) -> Result<(), String> {
    set_auto_launch_impl(&app, enabled)
}

#[tauri::command]
async fn get_auto_launch(app: tauri::AppHandle) -> Result<bool, String> {
    get_auto_launch_impl(&app)
}

#[tauri::command]
async fn open_file_picker(
    app: tauri::AppHandle,
    options: Option<FileDialogOptions>,
) -> Result<Option<Vec<String>>, String> {
    open_file_picker_impl(&app, options)
}

#[tauri::command]
async fn save_file_picker(
    app: tauri::AppHandle,
    options: Option<FileDialogOptions>,
) -> Result<Option<String>, String> {
    save_file_picker_impl(&app, options)
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    read_file_impl(&path)
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    write_file_impl(&path, &content)
}

#[tauri::command]
async fn write_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    write_clipboard_impl(&app, &text)
}

#[tauri::command]
async fn read_clipboard(app: tauri::AppHandle) -> Result<String, String> {
    read_clipboard_impl(&app)
}

#[tauri::command]
async fn register_global_shortcut(
    app: tauri::AppHandle,
    accelerator: String,
) -> Result<bool, String> {
    register_global_shortcut_impl(&app, &accelerator)
}

#[tauri::command]
async fn unregister_global_shortcut(
    app: tauri::AppHandle,
    accelerator: String,
) -> Result<(), String> {
    unregister_global_shortcut_impl(&app, &accelerator)
}

#[tauri::command]
async fn enter_focus_mode(app: tauri::AppHandle) -> Result<(), String> {
    enter_focus_mode_impl(&app)
}

#[tauri::command]
async fn exit_focus_mode(app: tauri::AppHandle) -> Result<(), String> {
    exit_focus_mode_impl(&app)
}

#[tauri::command]
async fn is_focus_mode_active() -> bool {
    is_focus_mode_active_impl()
}

#[tauri::command]
async fn set_close_behavior(behavior: String) -> Result<(), String> {
    set_close_behavior_impl(&behavior)
}

#[tauri::command]
async fn get_close_behavior() -> Result<String, String> {
    get_close_behavior_impl()
}

#[tauri::command]
async fn update_tray_menu(
    app: tauri::AppHandle,
    state: TrayMenuState,
) -> Result<(), String> {
    update_tray_menu_impl(&app, state)
}

#[tauri::command]
async fn update_tray_menu_labels(
    app: tauri::AppHandle,
    labels: TrayMenuLabels,
) -> Result<(), String> {
    update_tray_menu_labels_impl(&app, labels)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("window-visibility-changed", true);
            }
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let start_minimized = args.contains(&"--minimized".to_string());
            
            if let Some(window) = app.get_webview_window("main") {
                if start_minimized {
                    window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
                    let _ = window.emit("window-visibility-changed", false);
                }
            }
            
            #[cfg(not(target_os = "linux"))]
            {
                planit_lib::setup_system_tray(app.handle())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform_info,
            show_notification,
            set_auto_launch,
            get_auto_launch,
            open_file_picker,
            save_file_picker,
            read_file,
            write_file,
            write_clipboard,
            read_clipboard,
            register_global_shortcut,
            unregister_global_shortcut,
            enter_focus_mode,
            exit_focus_mode,
            is_focus_mode_active,
            set_close_behavior,
            get_close_behavior,
            update_tray_menu,
            update_tray_menu_labels,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let close_behavior = planit_lib::CLOSE_BEHAVIOR.read().unwrap();
                if &*close_behavior == "tray" {
                    api.prevent_close();
                    window.hide().unwrap();
                    let _ = window.emit("window-visibility-changed", false);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
