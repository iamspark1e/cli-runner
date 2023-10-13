import { useRef, useState } from 'react'
import { Button, Table, Icon, Header, Modal } from 'semantic-ui-react'
import ModifyTaskModal from './ModifyTaskModal'
import { message } from '@tauri-apps/api/dialog'
import GlobalConfig from "../model/GlobalConfig";
import './Tasks.scss'

const ConfirmRemoveTaskModal = ({ onConfirm }) => {
  const [open, setOpen] = useState(false)

  return (
    <Modal
      basic
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      size='small'
      trigger={<Button icon negative style={{ marginLeft: 6 }} title="删除" size='mini'>
        <Icon name='trash alternate outline' />
      </Button>}
    >
      <Header icon>
        <Icon name='trash' />
        确认删除
      </Header>
      <Modal.Content>
        <p style={{ textAlign: 'center' }}>
          确定删除此配置吗？此操作不可恢复！
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button basic inverted onClick={() => setOpen(false)}>
          <Icon name='remove' /> 取消
        </Button>
        <Button color='red' inverted onClick={() => {
          onConfirm && onConfirm()
          setOpen(false)
        }}>
          <Icon name='checkmark' /> 立即删除
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

const TaskRow = ({ task }) => {
  // const [_, forceUpdate] = useReducer(x => x + 1, 0);
  const [pid, setPid] = useState(task.pid)

  function toggleExecRunning() {
    if (task.pid) {
      task.mockKill().then(() => {
        const updatePidEvt = new CustomEvent("updateTaskPid", { detail: { id: task.id, pid: 0 } })
        document.dispatchEvent(updatePidEvt)
        setPid(0)
      }).catch(e => {
        console.log("kill error: ")
        console.log(e)
      })
    } else {
      task.mockStart().then(() => {
        const updatePidEvt = new CustomEvent("updateTaskPid", { detail: { id: task.id, pid: task.pid } })
        document.dispatchEvent(updatePidEvt)
        setPid(task.pid)
      }).catch(e => {
        console.log("start error: ")
        console.log(e)
      })
    }
  }

  const purgeTask = async () => {
    if (task.pid) {
      await task.kill().catch(e => {
        console.log('kill error')
        console.log(e)
      })
    }
  }
  function removeTaskFromConfig(task) {
    purgeTask(task).then(() => {
      const removeEvt = new CustomEvent("removeTask", { detail: { id: task.id } })
      document.dispatchEvent(removeEvt)
    })
  }
  function updateHandler(data) {
    purgeTask(task).then(() => {
      // FIXME: Check new config
      const updateEvt = new CustomEvent("updateTaskItem", {
        detail: data
      })
      document.dispatchEvent(updateEvt)
    })
  }

  return (
    <Table.Row positive={pid > 0} key={task.id}>
      <Table.Cell className='task-name'>
        <strong className='dashed-underline'>{task.name}</strong>
      </Table.Cell>
      <Table.Cell>{pid || "-"}</Table.Cell>
      <Table.Cell textAlign='left'>
        <code title={task.executable + ' ' + task.args}><b>{task.executable}</b> {task.args}</code>
      </Table.Cell>
      <Table.Cell>
        <div className='operate'>
          <Button icon title="Start/Stop" size='mini' onClick={toggleExecRunning}>
            {pid ? <Icon name='stop circle outline' /> : <Icon name='play circle outline' />}
          </Button>
          {/* <Button icon title="编辑..." size='mini' style={{ marginLeft: 6 }}>
            <Icon name='edit outline' />
          </Button> */}
          <ModifyTaskModal task={task} updateHandler={updateHandler} />
          {/* <Button icon negative style={{ marginLeft: 6 }} title="删除" size='mini'>
            <Icon name='trash alternate outline' />
          </Button> */}
          <ConfirmRemoveTaskModal onConfirm={() => { removeTaskFromConfig(task) }} />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export const TasksTableHandler = ({ config, addModal, terminate }) => {
  const virtualConfigInputRef = useRef(null)

  function configFileHandler(e) {
    if (e.target.files[0]) {
      var file = e.target.files[0]
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        // console.log(evt.target.result);
        try {
          let data = JSON.parse(evt.target.result);
          if (config && config instanceof GlobalConfig) {
            if (!Array.isArray(data)) {
              message("Error: load config JSON failed, please check!");
              return;
            }
            data.forEach(row => {
              try {
                config.addTask(row);
              } catch (err) {
                message("Error: load row failed, please check " + (row.id || ("NO ID ROW")));
              }
            })

            setTimeout(() => {
              window.location.reload()
            }, 1000)
          } else {
            message("Error: " + "config is not a constructor of `GlobalConfig`");
          }
        } catch (e) {
          console.log(e)
          message("Error: " + e.message);
        }
      }
      reader.onerror = function (evt) {
        console.log(evt);
        message("Read Error: " + e.message);
      }
    } else {
      console.log('no file')
    }
  }
  function loadConfigFile() {
    virtualConfigInputRef.current.click()
  }

  return (
    <div className="table-header">
      <Header as='h3'>程序列表</Header>
      <div className="right">
        {/* <Button size='tiny' positive icon labelPosition='left' onClick={props.addTask}><Icon name='add square' />添加</Button> */}
        {addModal}
        <input type='file' multiple={false} accept='.json,application/json' style={{ display: 'none' }} onChange={configFileHandler} ref={virtualConfigInputRef}></input>
        <Button size='tiny' icon title="导入配置文件" onClick={loadConfigFile}><Icon name='upload' /></Button>
        <Button size='tiny' icon title="导出配置文件" onClick={config ? () => { config.exportConfig() } : null}><Icon name='download'></Icon></Button>
        <Button size='tiny' icon negative title="结束所有程序并退出" onClick={terminate ? () => { terminate() } : null}><Icon name='sign-out'></Icon></Button>
      </div>
    </div>
  )
}

const TasksTable = ({ config, handlerComponent }) => {
  return (
    <Table celled striped singleLine compact className='tasks-table'>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan='4'>
            {handlerComponent}
          </Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell width={2}>名称</Table.HeaderCell>
          <Table.HeaderCell width={1}>PID</Table.HeaderCell>
          <Table.HeaderCell width={11}>命令</Table.HeaderCell>
          <Table.HeaderCell width={2}>操作</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body className='tasks-body'>
        {
          (config && config.tasks && Array.isArray(config.tasks) && config.tasks.length > 0) ?
            config.tasks.map((task) => {
              return (
                <TaskRow key={task.id} task={task} />
              )
            }) :
            <Table.Row>
              <Table.Cell colSpan='4' textAlign='center'>
                请点击<b>“添加”</b>来增加一个程序配置...
              </Table.Cell>
            </Table.Row>
        }
      </Table.Body>
    </Table>
  )
}

export default TasksTable