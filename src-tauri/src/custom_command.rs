use std::path::PathBuf;

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
    Output { pid: child.pid() }
}
