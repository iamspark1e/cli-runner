import { ConfigError, UnhandledError } from './CustomError'
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs"
import { confirm, save, message } from '@tauri-apps/api/dialog';
import { exit } from '@tauri-apps/api/process'
import { catchEm } from '../utils/scripts'
import { invoke } from "@tauri-apps/api/tauri";

/**
 * Example Config
 */
export const CONST_GLOBAL_CONFIG_FILENAME = ".cli-runner.config.json"

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

export class RunningTask extends Task {
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

  async mockStart() {
    let randomId = parseInt(Math.random() * 100);
    this.pid = randomId;
    return randomId;
  }

  async mockKill() {
    this.pid = 0;
    return true;
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

export default class GlobalConfig {
  loaded = false;
  filedir = "";
  tasks = [];
  constructor(filedir) {
    if (!filedir) throw new ConfigError("Missing config file path.")
    this.filedir = filedir;
  }

  _validator(rawfiledata) {
    try {
      let data = JSON.parse(rawfiledata)
      if (!data) return false; // empty file
      if (!Array.isArray(data)) return false; // incorrect root data type
      // TODO: add more validator.
    } catch (e) {
      console.log(e)
      return false; // parse failed
    }
    return true;
  }

  async load() {
    let [err, rawfiledata] = await catchEm(readTextFile(CONST_GLOBAL_CONFIG_FILENAME, {
      dir: this.filedir
    }))
    if (err) {
      if (typeof err === 'string' && err.includes("(os error 2)")) {
        let data = await confirm('未检测到配置文件，创建一个以立即使用？', 'CLI Runner')
        if (data) {
          await this.init()
          return;
        } else {
          await exit(1)
          return;
        }
      } else {
        throw new UnhandledError("model/GlobalConfig", err)
      }
    }
    // validate first
    if (!this._validator(rawfiledata)) throw new ConfigError("Load config failed.")
    this.tasks = JSON.parse(rawfiledata)
    this.loaded = true;
  }

  async mockLoad() {
    let mockRawfileData = []
    this.tasks = mockRawfileData.map(task => new RunningTask(task))
    this.loaded = true;
  }

  /**
   * memory tasks => local file
   */
  async save() {
    if (!this.loaded) throw new ConfigError("Config not loaded.")
    await writeTextFile(CONST_GLOBAL_CONFIG_FILENAME, JSON.stringify(this.tasks), {
      dir: this.filedir
    })
  }

  async init() {
    this.tasks = []
    this.loaded = true;
    await this.save()
  }

  // CRUD about task
  _validatorTask(taskInfo) {
    if (!taskInfo.name) return false;
    if (!taskInfo.executable) return false;
    // allow empty args
    // allow empty cwd
    return true;
  }
  async addTask(taskInfo) {
    if (!this.loaded) throw new ConfigError("Config not loaded.")
    if (!this._validatorTask(taskInfo)) throw new ConfigError("New task scheme error.")
    if(taskInfo.id && this.tasks.findIndex(task => task.id === taskInfo.id) > -1) {
      console.log('skipped row: ' + JSON.stringify(taskInfo))
      if(taskInfo.name) {
        message("Error: duplicate task '"+taskInfo.id+":"+taskInfo.name+"'");
      }
      return;
    }
    this.tasks.push({
      id: this.tasks.length < 1 ? 1 : (this.tasks[this.tasks.length - 1].id + 1),
      name: taskInfo.name,
      executable: taskInfo.executable,
      args: taskInfo.args || "",
      cwd: taskInfo.cwd || "",
      auto_start: Boolean(taskInfo.auto_start) || false
    })
    await this.save()
  }
  async removeTask(taskId) {
    console.log(taskId)
    if (!this.loaded) throw new ConfigError("Config not loaded.")
    if (typeof taskId !== 'number' && taskId < 0) throw new ConfigError("Removing illegel index of task.")
    let idx = this.tasks.findIndex(task => task.id === taskId)
    if (idx < 0) throw new ConfigError("Removing not exist task")
    this.tasks.splice(idx, 1)
    await this.save()
  }
  async updateTask(taskId, newTaskInfo) {
    if (!this.loaded) throw new ConfigError("Config not loaded.")
    if (typeof taskId !== 'number' && taskId < 0) throw new ConfigError("Updating illegel index of task.")
    let idx = this.tasks.findIndex(task => task.id === taskId)
    if (idx < 0) throw new ConfigError("Failed to update a non-exist task")
    if (!this._validatorTask(newTaskInfo)) throw new ConfigError("New task scheme error.")
    this.tasks.splice(idx, 1, {
      id: this.tasks.length < 1 ? 0 : (this.tasks[this.tasks.length - 1].id + 1),
      name: newTaskInfo.name,
      executable: newTaskInfo.executable,
      args: newTaskInfo.args || "",
      cwd: newTaskInfo.cwd || "",
      auto_start: Boolean(newTaskInfo.auto_start) || false
    })
    await this.save()
  }
  // TODO: findTask(task) {}?

  async exportConfig() {
    const filepath = await save({
      filters: [{
        name: 'JSON File',
        extensions: ['json'],
      }],
      defaultPath: `cli-runner-backup-${new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + (new Date().getDate())}.config.json`
    }).catch(e => {
      console.log(e)
      throw e;
    })
    if (!filepath) return;
    await writeTextFile(filepath, JSON.stringify(this.tasks)).catch(e => {
      console.log(e)
      throw e;
    })
  }
}