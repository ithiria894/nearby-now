import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import s from "../legal.module.css";

export const metadata = { title: "enoki · Terms" };

// #60 — DRAFT copy. ⚠️ Needs Nicole's review before launch (not a merge blocker).
export default function Terms() {
  return (
    <>
      <TopBar />
      <main className={s.main}>
        <h1 className="t-h1">Terms</h1>
        <p className="t-caption" style={{ color: "var(--faint)" }}>
          Draft — pending review.
        </p>

        <h2 className="t-h2">Be decent</h2>
        <p className="t-body">
          enoki is for getting people together in good faith. No harassment, no
          scams, no using hangouts to sell or self-promote, no illegal activity.
        </p>

        <h2 className="t-h2">Meeting strangers</h2>
        <p className="t-body">
          Hangouts may involve meeting people you don&apos;t know. Use your
          judgment, meet in public, and look out for yourself. enoki does not
          vet users.
        </p>

        <h2 className="t-h2">Moderation</h2>
        <p className="t-body">
          We may remove content or accounts that break these terms. Report
          issues to <a href="mailto:hello@enokiapp.com">hello@enokiapp.com</a>.
        </p>

        <p className="t-body" style={{ marginTop: 24 }}>
          <Link href="/">← home</Link>
        </p>
      </main>
    </>
  );
}
