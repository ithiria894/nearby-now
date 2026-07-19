import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import s from "./Input.module.css";

type Props = {
  label?: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

// Input — BInput port. Controlled or uncontrolled. Focus thickens the border
// toward brand (no blue glow). Portable client React.
export function Input({ label, hint, error, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={[s.wrap, error ? s.error : ""].filter(Boolean).join(" ")}>
      {label ? (
        <label className={s.label} htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={s.field}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        {...rest}
      />
      {error ? (
        <span id={msgId} className={`${s.msg} ${s.msgError}`}>
          {error}
        </span>
      ) : hint ? (
        <span id={msgId} className={s.msg}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
