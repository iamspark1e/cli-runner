import { invoke } from "@tauri-apps/api/tauri";
// import { Command } from '@tauri-apps/api/shell';
// Custom version of command, due to `scope` limitation;
import { BaseDirectory } from '@tauri-apps/api/fs'
import { SpawnFailedError, KillFailedError } from './CustomError'
import { sep } from '@tauri-apps/api/path'

export class Task {
  constructor(data) {
    // TaskConfigs
    this.id = data.id;
    this.name = data.name;
    this.executable = data.executable || BaseDirectory.Home;
    this.args = data.args;
    this.cwd = data.cwd || "";
    this.auto_start = Boolean(data.auto_start) || false;
  }
}

export default class RunningTask extends Task {
  pid = 0; // 0: 未运行
           // int: 运行中
  constructor(data) {
    super(data)
  }

  async start() {
    if(this.pid) throw new Error("Task already started")
    // old way:
    // let data = await new Command(exe, this.args, { cwd: this.cwd }).spawn().catch(e => {
    //   console.log(e)
    //   throw new SpawnFailedError(e.message)
    // })
    let data = await invoke("run_command", {
      command: this.executable,
      args: this.args.split(" "),
      dir: this.cwd
    }).catch(e => {
      console.log(e)
    })
    this.pid = data.pid;
    return data.pid;
  }

  async kill() {
    if(!this.pid) throw new KillFailedError("Task is not running");
    await invoke("kill_pid", { pid: this.pid.toString() }).catch(e => {
      console.log(e);
      throw new KillFailedError(e.message)
    })
    this.pid = 0;
    return true;
  }
}