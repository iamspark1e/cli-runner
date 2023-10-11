import './AddTaskModal.scss'
import { useState } from 'react'
import { useRef } from 'react'
import { findDOMNode } from 'react-dom'
import { Button, Form, Modal, Icon, Checkbox } from 'semantic-ui-react'
import { open as nativeOpen } from '@tauri-apps/api/dialog'
import { type } from '@tauri-apps/api/os'

function ModifyTaskModal({ task, updateHandler }) {
  const [open, setOpen] = useState(false)
  const [execPath, setExecPath] = useState(task.executable)
  const [cwd, setCwd] = useState(task.cwd)
  const formRef = useRef(null)

  function nativeSelectFile() {
    type().then(osType => {
      nativeOpen({
        filters: [{
          name: 'Executable files',
          // TODO: executable file extensions of different platforms?
          extensions: osType === "Windows_NT" ? ['exe'] : ["*"]
        }]
      }).then(selected => {
        // `null` if not select
        console.log(selected)
        setExecPath(selected)
      }).catch(e => {
        console.log(e)
      })
    })
  }

  function nativeSelectCwd() {
    nativeOpen({
      directory: true
    }).then(selected => {
      // `null` if not select
      console.log(selected)
      setCwd(selected)
    }).catch(e => {
      console.log(e)
    })
  }

  function show() {
    setOpen(true)
  }
  function hide() {
    setExecPath(null)
    setCwd("")
    setOpen(false)
  }
  function save() {
    let data = Object.fromEntries(new FormData(findDOMNode(formRef.current)))
    updateHandler({
      id: task.id,
      ...data,
      cwd,
      executable: execPath,
      auto_start: data.auto_start === '',
      pid: task.pid || 0
    })
    hide()
  }

  return (
    <Modal
      closeIcon
      onClose={hide}
      onOpen={show}
      open={open}
      trigger={<Button icon title="编辑..." size='mini' style={{ marginLeft: 6 }} disabled={task.pid}>
        <Icon name='edit outline' />
      </Button>}
      className="add-task-modal"
    >
      <Modal.Header>设置</Modal.Header>
      <Modal.Content scrolling>
        <Form ref={formRef}>
          <Form.Field inline>
            <label>名称</label>
            <input placeholder='设置一个任务名' name='name' defaultValue={task.name} />
          </Form.Field>
          <Form.Field inline>
            <label>可执行文件位置</label>
            {execPath ? <span>{execPath}<Button icon size='tiny' style={{ marginLeft: 10 }} onClick={() => { setExecPath(null) }}><Icon name='close' /></Button></span> : <Button onClick={nativeSelectFile}>选择文件...</Button>}
          </Form.Field>
          <Form.Field inline>
            <label>执行参数</label>
            <input placeholder='参数' name='args' defaultValue={task.args} />
          </Form.Field>
          <Form.Field inline>
            <label>运行文件目录</label>
            {cwd ? <span>{cwd}<Button icon size='tiny' style={{ marginLeft: 10 }} onClick={() => { setCwd(null) }}><Icon name='close' /></Button></span> : <Button onClick={nativeSelectCwd}>选择运行上下文</Button>}
          </Form.Field>
          <Form.Field>
            <Checkbox label='CLI Runner启动时，自动运行本任务？' name='auto_start' defaultChecked={task.auto_start} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          content="保存"
          labelPosition='left'
          icon='checkmark'
          onClick={save}
          positive
        />
        <Button color='black' onClick={hide}>
          取消
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default ModifyTaskModal