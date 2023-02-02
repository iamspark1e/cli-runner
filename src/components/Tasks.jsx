import { useReducer, useState } from 'react'
import { Button, Table, Icon, Header, Modal } from 'semantic-ui-react'
import ModifyTaskModal from './ModifyTaskModal'
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
  // FIXME: how to avoid `forceUpdate()` ?
  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  function toggleExecRunning() {
    if (task.pid) {
      task.kill().then(() => {
        const updatePidEvt = new CustomEvent("updateTaskPid", { detail: { id: task.id, pid: 0 } })
        document.dispatchEvent(updatePidEvt)
        forceUpdate()
      }).catch(e => {
        console.log("kill error: ")
        console.log(e)
      })
    } else {
      task.start().then(() => {
        const updatePidEvt = new CustomEvent("updateTaskPid", { detail: { id: task.id, pid: task.pid } })
        document.dispatchEvent(updatePidEvt)
        forceUpdate()
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
      forceUpdate()
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
    <Table.Row positive={task.pid > 0}>
      <Table.Cell className='task-name'>
        <strong className='dashed-underline'>{task.name}</strong>
      </Table.Cell>
      <Table.Cell>{task.pid || "-"}</Table.Cell>
      <Table.Cell textAlign='left'>
        <code title={task.executable + ' ' + task.args}><b>{task.executable}</b> {task.args}</code>
      </Table.Cell>
      <Table.Cell>
        <div className='operate'>
          <Button icon title="Start/Stop" size='mini' onClick={toggleExecRunning}>
            {task.pid ? <Icon name='stop circle outline' /> : <Icon name='play circle outline' />}
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
  return (
    <div className="table-header">
      <Header as='h3'>程序列表</Header>
      <div className="right">
        {/* <Button size='tiny' positive icon labelPosition='left' onClick={props.addTask}><Icon name='add square' />添加</Button> */}
        {addModal}
        <Button size='tiny' icon title="导出配置文件" onClick={config ? () => { config.exportConfig() } : null}><Icon name='download'></Icon></Button>
        <Button size='tiny' icon negative title="结束所有程序并退出" onClick={terminate ? () => { terminate() } : null}><Icon name='sign-out'></Icon></Button>
      </div>
    </div>
  )
}

const TasksTable = ({ tasks, handlerComponent }) => {
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
          (tasks && Array.isArray(tasks) && tasks.length > 0) ?
            tasks.map((task) => {
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