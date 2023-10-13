import "./main.scss";
import { useState } from "react";
import { BaseDirectory } from "@tauri-apps/api/fs";
import { exit } from '@tauri-apps/api/process'
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect } from "react";
import TaskTable, { TasksTableHandler } from "./components/Tasks"
import AddTaskModal from "./components/AddTaskModal"
import GlobalConfig from "./model/GlobalConfig";
// import RunningTask from "./model/TaskModel";
import { message } from "@tauri-apps/api/dialog";

function App() {
  // load config first
  const [config, setConfig] = useState(null)
  // config.tasks 静态属性，runState 运行状态，根据task.id进行联合得到实时状态
  // const [tasks, setTasks] = useState([])
  // const [pidMapping, setPidMapping] = useState({})

  // useEffect(() => {
  //   if (config && config instanceof GlobalConfig) {
  //     config.mockLoad().then(() => {
  //       // updateTaskListHandler()
  //     }).catch(e => {
  //       console.log(e);
  //     })
  //     console.log(config.loaded)
  //   }
  // }, [config])

  // mounted lifecycle
  useEffect(() => {
    let _config = new GlobalConfig(BaseDirectory.Home)
    _config.load().then(() => {
      // updateTaskListHandler()
      setConfig(_config)
    }).catch(e => {
      console.log(e);
    })

    window.__exitApp = exitApp;

    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }, [])

  // page mounted without dependencies
  useEffect(() => {
    // Custom event listeners
    document.addEventListener("updateTaskList", updateTaskListHandler)
    document.addEventListener("updateTaskItem", updateTaskItemHandler)
    document.addEventListener("updateTaskPid", updateTaskPid)
    document.addEventListener("removeTask", removeTaskHandler)
    return () => {
      document.removeEventListener("updateTaskList", updateTaskListHandler)
      document.removeEventListener("updateTaskItem", updateTaskItemHandler)
      document.removeEventListener("updateTaskPid", updateTaskPid)
      document.removeEventListener("removeTask", removeTaskHandler)
    }
  }, [config])

  const updateTaskListHandler = () => {
    if (config) {
      // setTasks(config.tasks.map(task => {
      //   let taskEntity = new RunningTask(task)
      //   if (pidMapping[taskEntity.id]) {
      //     taskEntity.pid = pidMapping[taskEntity.id]
      //   }
      //   return taskEntity;
      // }))
    }
  }

  const updateTaskItemHandler = (e) => {
    if (!config) return;
    let newTask = e.detail
    if (!newTask || !newTask.hasOwnProperty('id')) return; // invalid task.id
    config.updateTask(newTask.id, newTask).then(() => {
      // updateTaskListHandler()
    })
  }

  const updateTaskPid = (e) => {
    let data = e.detail;
    if (!data) return;
    // console.log(data.id);
    // let updated = pidMapping;
    // updated[data.id] = data.pid;
    // setPidMapping(updated);
  }

  const removeTaskHandler = (e) => {
    if (!config) return; // config not initialized
    let id = e.detail ? e.detail.id : null
    if (!id) return;
    config.removeTask(id).then(() => {
      // updateTaskListHandler()
    }).catch(e => {
      console.log(e)
    })
  }

  // update list when `pidMapping` changes
  // useEffect(() => {
  // updateTaskListHandler()
  // }, [pidMapping])

  const exitApp = () => {
    let endTaskQuene = []
    if (config && config.tasks && Array.isArray(config.tasks)) {
      for (let task in config.tasks) {
        if (task.pid) {
          endTaskQuene.push(invoke("kill_pid", { pid: task.pid.toString() }))
        }
      }
      Promise.all(endTaskQuene).then(
        data => {
          console.log(data)
          return;
        }
      ).then(() => {
        exit(1)
      }, (reject) => {
        message("end tasks failed! (" + JSON.stringify(reject) + ")");
      }).catch(e => {
        message(e.message);
      })
    }
  }

  return (
    <div className="container">
      <section>
        {
          config && config instanceof GlobalConfig && config.tasks ?
            <TaskTable
              // tasks={config.tasks}
              config={config}
              handlerComponent={
                <TasksTableHandler
                  addModal={<AddTaskModal config={config} />}
                  config={config}
                  terminate={exitApp}
                />
              }
            /> :
            null
        }
      </section>
    </div>
  );
}

export default App;
