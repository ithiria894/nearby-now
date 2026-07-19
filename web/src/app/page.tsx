import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Avatar } from "@/components/Avatar";
import s from "./page.module.css";

// Landing (#56). The only indexable page. Explains enoki in one breath and
// routes to /new. Static server component.

const STEPS = [
  "Post what you feel like doing",
  "Drop the link in your group chat",
  "People tap in — no signup",
];

export default function Home() {
  return (
    <>
      <TopBar
        right={
          <Link href="/rooms">
            <Chip>My rooms</Chip>
          </Link>
        }
      />
      <main className={s.main}>
        <div className={s.hero}>
          <div className={s.mascot}>
            <Avatar size={72} />
          </div>
          <h1 className={`t-wordmark ${s.wordmark}`}>enoki</h1>
          <p className={`t-body ${s.tagline}`}>
            Get people together — without being the host.
          </p>
          <Link href="/new" className={s.cta}>
            <Button full>Start a hangout</Button>
          </Link>
        </div>

        <ol className={s.steps}>
          {STEPS.map((t, i) => (
            <li key={i} className={s.step}>
              <Chip tone="brand">{String(i + 1)}</Chip>
              <span className="t-title">{t}</span>
            </li>
          ))}
        </ol>

        <footer className={s.footer}>
          <Link href="/privacy">Privacy</Link>
          <span aria-hidden> · </span>
          <Link href="/terms">Terms</Link>
        </footer>
      </main>
    </>
  );
}
