#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(target_os = "windows")]
use std::sync::mpsc::{self, Sender};
#[cfg(target_os = "windows")]
use std::sync::Mutex;
#[cfg(target_os = "windows")]
use std::thread;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::*;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::*;
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::*;
#[cfg(target_os = "windows")]
use windows::Win32::System::LibraryLoader::GetModuleHandleW;

#[cfg(target_os = "windows")]
static BLOCK_SHORTCUTS: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "windows")]
static HOOK_SENDER: Mutex<Option<Sender<HookCommand>>> = Mutex::new(None);

#[cfg(target_os = "windows")]
enum HookCommand {
    Install,
    Uninstall,
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn low_level_keyboard_hook(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if BLOCK_SHORTCUTS.load(Ordering::SeqCst) && n_code >= 0 {
        let kb_struct = &*(l_param.0 as *const KBDLLHOOKSTRUCT);
        let vk_code = kb_struct.vkCode;
        let flags = kb_struct.flags;

        let alt_pressed = flags & KBDLLHOOKSTRUCT_FLAGS(LLKHF_ALTDOWN.0) != KBDLLHOOKSTRUCT_FLAGS(0);
        let win_pressed = is_win_pressed();

        let vk_tab = VK_TAB.0 as u32;
        let vk_escape = VK_ESCAPE.0 as u32;
        let vk_f4 = VK_F4.0 as u32;
        let vk_d = VK_D.0 as u32;
        let vk_e = VK_E.0 as u32;
        let vk_r = VK_R.0 as u32;
        let vk_l = VK_L.0 as u32;
        let vk_m = VK_M.0 as u32;
        let vk_lwin = VK_LWIN.0 as u32;
        let vk_rwin = VK_RWIN.0 as u32;

        let should_block = match vk_code {
            code if code == vk_tab && alt_pressed => true,
            code if code == vk_escape && alt_pressed => true,
            code if code == vk_f4 && alt_pressed => true,
            code if code == vk_d && (win_pressed || alt_pressed) => true,
            code if code == vk_e && win_pressed => true,
            code if code == vk_r && win_pressed => true,
            code if code == vk_l && win_pressed => true,
            code if code == vk_m && win_pressed => true,
            code if code == vk_lwin || code == vk_rwin => true,
            _ => false,
        };

        if should_block {
            return LRESULT(1);
        }
    }

    CallNextHookEx(HHOOK::default(), n_code, w_param, l_param)
}

#[cfg(target_os = "windows")]
unsafe fn is_win_pressed() -> bool {
    (GetAsyncKeyState(VK_LWIN.0 as i32) as u16 & 0x8000) != 0
        || (GetAsyncKeyState(VK_RWIN.0 as i32) as u16 & 0x8000) != 0
}

#[cfg(target_os = "windows")]
fn hook_thread_main(rx: mpsc::Receiver<HookCommand>) {
    unsafe {
        let mut current_hook: Option<HHOOK> = None;
        let module = match GetModuleHandleW(None) {
            Ok(m) => m,
            Err(_) => return,
        };

        let mut msg = MSG::default();

        loop {
            if PeekMessageW(&mut msg, None, 0, 0, PM_REMOVE).as_bool() {
                if msg.message == WM_QUIT {
                    break;
                }
                let _ = TranslateMessage(&msg);
                let _ = DispatchMessageW(&msg);
            }

            match rx.try_recv() {
                Ok(HookCommand::Install) => {
                    if current_hook.is_none() {
                        if let Ok(hook) = SetWindowsHookExW(
                            WINDOWS_HOOK_ID(WH_KEYBOARD_LL.0),
                            Some(low_level_keyboard_hook),
                            module,
                            0,
                        ) {
                            current_hook = Some(hook);
                            BLOCK_SHORTCUTS.store(true, Ordering::SeqCst);
                        }
                    }
                }
                Ok(HookCommand::Uninstall) => {
                    BLOCK_SHORTCUTS.store(false, Ordering::SeqCst);
                    if let Some(hook) = current_hook.take() {
                        let _ = UnhookWindowsHookEx(hook);
                    }
                }
                Err(mpsc::TryRecvError::Disconnected) => {
                    break;
                }
                Err(mpsc::TryRecvError::Empty) => {}
            }

            thread::sleep(std::time::Duration::from_millis(1));
        }

        if let Some(hook) = current_hook {
            let _ = UnhookWindowsHookEx(hook);
        }
    }
}

#[cfg(target_os = "windows")]
pub fn install_keyboard_hook() -> Result<(), String> {
    let mut sender_guard = HOOK_SENDER.lock().unwrap();
    
    if sender_guard.is_none() {
        let (tx, rx) = mpsc::channel();
        thread::spawn(move || hook_thread_main(rx));
        *sender_guard = Some(tx);
    }

    if let Some(sender) = sender_guard.as_ref() {
        sender
            .send(HookCommand::Install)
            .map_err(|e| format!("Failed to send install command: {}", e))?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
pub fn uninstall_keyboard_hook() -> Result<(), String> {
    BLOCK_SHORTCUTS.store(false, Ordering::SeqCst);

    let sender_guard = HOOK_SENDER.lock().unwrap();
    if let Some(sender) = sender_guard.as_ref() {
        let _ = sender.send(HookCommand::Uninstall);
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn install_keyboard_hook() -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn uninstall_keyboard_hook() -> Result<(), String> {
    Ok(())
}
