"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { Button, Input } from "./PlatformUI";
import SchoolIcon from "../brand/SchoolIcon";
import { cancelDialogScope, settleDialog } from "../../lib/pending-dialog.mjs";

const DialogContext = createContext(null);
function DialogContent({ request, finish }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const [text, setText] = useState(request.initialValue || "");
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    input.current?.focus();
  }, []);
  const cancel = () => finish(request.kind === "confirm" ? false : null);
  return <dialog ref={dialog} className="ui-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); cancel(); }}
    onClick={(event) => { if (event.target === event.currentTarget) cancel(); }}>
    <form className="ui-dialog-body" onSubmit={(event) => { event.preventDefault(); finish(request.kind === "text" ? text : true); }}>
      <span className="school-icon-tile school-tone-copper"><SchoolIcon name={request.kind === "confirm" ? "shield" : "pencil"} size={25} /></span>
      <h2 id={titleId}>{request.kind === "confirm" ? "تأكيد العملية" : request.kind === "text" ? "تعديل البيانات" : "تنبيه"}</h2>
      <p id={descriptionId}>{request.message}</p>
      {request.kind === "text" && <><label htmlFor={inputId}>الاسم الجديد</label><Input ref={input} id={inputId} value={text} onChange={(event) => setText(event.target.value)} /></>}
      <div className="ui-dialog-actions">
        <Button type="submit" variant={request.kind === "confirm" ? "danger" : "primary"}>{request.kind === "text" ? "حفظ التعديل" : request.kind === "confirm" ? "تأكيد" : "حسنًا"}</Button>
        {request.kind !== "notice" && <Button variant="secondary" onClick={cancel}>إلغاء</Button>}
      </div>
    </form>
  </dialog>;
}
export function DialogProvider({ children, scopeKey = "public" }) {
  const [request, setRequest] = useState(null);
  const pending = useRef(null);
  const sequence = useRef(0);
  const open = useCallback((kind, message, initialValue) => {
    // A second request cancels the old one rather than leaving an unresolved action.
    pending.current?.resolve(null);
    return new Promise((resolve) => {
      sequence.current += 1;
      pending.current = { resolve, id: sequence.current, scopeKey };
      setRequest({ id: sequence.current, kind, message, initialValue, scopeKey });
    });
  }, [scopeKey]);
  const notify = useCallback((message) => open("notice", message), [open]);
  const confirmAction = useCallback(async (message) => (await open("confirm", message)) === true, [open]);
  const requestText = useCallback((message, initialValue = "") => open("text", message, initialValue), [open]);
  const finish = (value, id) => {
    if (settleDialog(pending, id, scopeKey, value)) setRequest(null);
  };
  useEffect(() => { cancelDialogScope(pending, scopeKey); }, [scopeKey]);
  useEffect(() => () => { pending.current?.resolve(null); }, []);
  return <DialogContext.Provider value={{ notify, confirmAction, requestText }}>{children}{request?.scopeKey === scopeKey && <DialogContent key={request.id} request={request} finish={(value) => finish(value, request.id)} />}</DialogContext.Provider>;
}
export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogProvider is required");
  return context;
}
