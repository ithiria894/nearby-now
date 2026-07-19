import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import s from "../legal.module.css";

export const metadata = { title: "enoki · Privacy" };

// #60 — DRAFT copy. ⚠️ Needs Nicole's review before launch (not a merge blocker).
export default function Privacy() {
  return (
    <>
      <TopBar />
      <main className={s.main}>
        <h1 className="t-h1">Privacy</h1>
        <p className="t-caption" style={{ color: "var(--faint)" }}>
          Draft — pending review.
        </p>

        <h2 className="t-h2">What we store</h2>
        <p className="t-body">
          When you tap into a hangout, we create an anonymous account tied to
          your browser and store the nickname you choose. We store the hangouts
          you create or join and the messages you send in them.
        </p>

        <h2 className="t-h2">No private messages</h2>
        <p className="t-body">
          enoki has no one-to-one messaging. Every message is visible to
          everyone in that hangout&apos;s group.
        </p>

        <h2 className="t-h2">Identity</h2>
        <p className="t-body">
          You are anonymous to other users — they see your nickname, not your
          identity. You can change your nickname at any time.
        </p>

        <h2 className="t-h2">Moderation &amp; deletion</h2>
        <p className="t-body">
          To report someone or request deletion of your data, contact{" "}
          <a href="mailto:hello@enokiapp.com">hello@enokiapp.com</a>.
        </p>

        <p className="t-body" style={{ marginTop: 24 }}>
          <Link href="/">← home</Link>
        </p>
      </main>
    </>
  );
}
