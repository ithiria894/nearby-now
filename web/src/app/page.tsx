import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { FeedClient } from "./FeedClient";
import s from "./page.module.css";

// / — the FEED (#67, WEB_PLAN §3.3 revised): open hangouts + recently-happened
// (FOMO), All/Nearby/Online. The hero + shell render server-side (indexable);
// the list hydrates client-side. Create is one tap away: floating + on mobile,
// header CTA on desktop.

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
          <div>
            <h1 className={`t-wordmark ${s.wordmark}`}>enoki</h1>
            <p className={`t-caption ${s.tagline}`}>
              Spontaneous hangouts — tap in, no signup.
            </p>
          </div>
          <Link href="/new" className={s.heroCta}>
            <Button>Start a hangout</Button>
          </Link>
        </div>

        <FeedClient />

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
