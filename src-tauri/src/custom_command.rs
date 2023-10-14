use std::path::PathBuf;
// use std::process::Command;
use std::{collections::HashMap, sync::Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref CREATED_PROCESS: Mutex<HashMap<String, tauri::api::process::CommandChild>> = {
        let map = HashMap::new();
        Mutex::new(map)
    };
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }
#[derive(serde::Serialize)]
pub struct Output {
    pid: u32,
}

// Example code:
// tauri::async_runtime::spawn(async move {
//   let (mut rx, mut child) = Command::new("cargo")
//     .args(["tauri", "dev"])
//     .spawn()
//     .expect("Failed to spawn cargo");
//   let mut i = 0;
//   while let Some(event) = rx.recv().await {
//     if let CommandEvent::Stdout(line) = event {
//       println!("got: {}", line);
//       i += 1;
//       if i == 4 {
//         child.write("message from Rust\n".as_bytes()).unwrap();
//         i = 0;
//       }
//     }
//   }
// });
#[tauri::command]
pub fn run_command(command: String, args: Vec<String>, dir: String) -> Output {
    let path_buf = PathBuf::from(dir);
    // TODO: add a channel to show _rx stdout/stderr
    let (mut _rx, child) = tauri::api::process::Command::new(command)
        .current_dir(path_buf)
        .args(args)
        .spawn()
        .expect("Failed to spawn custom program");
    unsafe {
        let pid = child.pid().to_string();
        CREATED_PROCESS.lock().unwrap().insert(pid, child);
    }
    Output { pid: child.pid() }
}

#[tauri::command]
pub fn kill_pid(pid: &str) {
    // let kill_result = Command::new("cmd.exe")
    //     .arg("/C")
    //     .arg("taskkill")
    //     .arg("/pid")
    //     .arg(format!("{}", pid))
    //     .arg("/F")
    //     .spawn();
    // // Output:
    // // Ok(Child { stdin: None, stdout: None, stderr: None, .. })
    // // SUCCESS: The process with PID 10492 has been terminated.
    // println!("{:?}", kill_result)
    unsafe {
        let child_process: tauri::api::process::CommandChild = CREATED_PROCESS.lock().unwrap().unwrap().get(pid);
        child_process.kill().expect("!kill");
        CREATED_PROCESS.lock().unwrap().remove(pid);
    }
}