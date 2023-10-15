#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

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
        .invoke_handler(tauri::generate_handler![custom_command::kill_pid, custom_command::run_command])
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
