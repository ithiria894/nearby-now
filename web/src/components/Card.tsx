import type { HTMLAttributes } from "react";
import s from "./Card.module.css";

// Card — the base paper surface (BCard). Portable client React.
export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[s.card, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
