import Link from "next/link";
import styles from "./page.module.css";

// Placeholder landing (issue #40 scaffold). The real landing — wordmark in
// Madimi One, mascot, CTA to /new, how-it-works — is issue #56 (built to the
// approved /design mockup #47).

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.wordmark}>enoki</h1>
      <p className={styles.tagline}>
        get people together — without being the host.
      </p>
      <p className={styles.footer}>
        <Link href="/design">design system →</Link>
      </p>
    </main>
  );
}
