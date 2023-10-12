#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn kill_pid(pid: &str) {
    let kill_result = Command::new("cmd.exe")
        .arg("/C")
        .arg("taskkill")
        .arg("/pid")
        .arg(format!("{}", pid))
        .arg("/F")
        .spawn();
    // Output:
    // Ok(Child { stdin: None, stdout: None, stderr: None, .. })
    // SUCCESS: The process with PID 10492 has been terminated.
    println!("{:?}", kill_result)
}

mod custom_command;
mod tray;

// struct Payload {
//     args: Vec<String>,
//     cwd: String,
//   }

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| { // https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/single-instance
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            // app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
        }))
        .invoke_handler(tauri::generate_handler![greet, kill_pid, custom_command::run_command])
        // .menu(tauri::Menu::os_default(&context.package_info().name)) // 注册窗体内菜单
        .system_tray(tray::menu()) // ✅ 将 `tauri.conf.json` 上配置的图标添加到系统托盘
        .on_system_tray_event(tray::handler) // ✅ 注册系统托盘事件处理程序
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                println!("system tray received a close event");
                let window = event.window().clone();
                window.hide().unwrap();
            }
            &_ => {}
        })
        .build(context)
        .expect("error while running tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => api.prevent_exit(),
            _ => {}
        })
}
