import "./Dialog.scss";
import { forwardRef } from "react";
import { useImperativeHandle } from "react";
import { useState } from "react";

const Dialog = (props, ref) => {
  const [dialogData, setDialogData] = useState({})
  const [isOpen, setIsOpen] = useState(false)

  function hide() {
    setIsOpen(false)
  }
  function show(data) {
    setDialogData(data)
    setIsOpen(true)
  }

  useImperativeHandle(ref, () => {
    return {
      show
    }
  })

  return (
    <div className="dialog" data-show={isOpen} ref={ref}>
      <div className="dialog-box">
        <div className="box-title">
          <div className="left">{dialogData.title}</div>
          <div className="right">
            <i className="icon-button ico-close" onClick={() => {hide()}}></i>
          </div>
        </div>
        <div className="box-content">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default forwardRef(Dialog);