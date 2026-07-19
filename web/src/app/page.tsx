import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { ProfileSlot } from "@/components/ProfileSlot";
import { FeedClient } from "./FeedClient";
import s from "./page.module.css";

// / — Discover (v2, #69). The indexable front page: featured carousel + browse
// + recently-happened, location scope pill, session-aware header (#70 — no
// session renders NO account UI). Hero removed: the TopBar carries the brand.

export default function Home() {
  return (
    <>
      <TopBar right={<ProfileSlot />} />
      <main className={s.main}>
        <FeedClient />
        <div className={s.newHere}>
          New here? Post what you feel like doing, drop the link in your group
          chat, people tap in — no signup. ·{" "}
          <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link>
        </div>
      </main>
    </>
  );
}
