import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { LEGAL_DOCUMENTS } from "../data/legal-documents";

const DOCUMENT_LINKS = {
  en: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/imprint", label: "Imprint" },
  ],
  de: [
    { href: "/terms?lang=de", label: "AGB" },
    { href: "/privacy?lang=de", label: "Datenschutz" },
    { href: "/imprint?lang=de", label: "Impressum" },
  ],
};

export default function LegalPage({ documentKey, language }) {
  const router = useRouter();
  const activeLanguage =
    router.query.lang === "de"
      ? "de"
      : router.query.lang === "en"
        ? "en"
        : language === "Deutsch"
          ? "de"
          : "en";
  const document = LEGAL_DOCUMENTS[activeLanguage]?.[documentKey];
  const copy = activeLanguage === "de"
    ? {
        draft: "ARBEITSENTWURF · NICHT ZUR VERÖFFENTLICHUNG",
        note: "Dieser Text ist noch nicht für den öffentlichen Launch freigegeben.",
        openTitle: "Vor Veröffentlichung zu klären",
        english: "English",
        german: "Deutsch",
        back: "Zurück zur App",
      }
    : {
        draft: "WORKING DRAFT · NOT FOR PUBLICATION",
        note: "This text is not yet approved for public launch.",
        openTitle: "To confirm before publication",
        english: "English",
        german: "Deutsch",
        back: "Back to the app",
      };

  if (!document) return null;

  return (
    <>
      <Head>
        <title>{`${document.title} · PREMIVATE`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="legal-page">
        <div className="legal-shell">
          <header className="legal-header">
            <div className="legal-topline">
              <p className="legal-eyebrow">{document.eyebrow}</p>
              <div className="legal-language" aria-label="Document language">
                <Link
                  aria-current={activeLanguage === "en" ? "page" : undefined}
                  href={{ pathname: router.pathname, query: { lang: "en" } }}
                >
                  {copy.english}
                </Link>
                <Link
                  aria-current={activeLanguage === "de" ? "page" : undefined}
                  href={{ pathname: router.pathname, query: { lang: "de" } }}
                >
                  {copy.german}
                </Link>
              </div>
            </div>
            <h1>{document.title}</h1>
            <p className="legal-summary">{document.summary}</p>
            <p className="legal-version">{document.version}</p>
          </header>

          <div className="legal-draft-note" role="status">
            <span className="legal-draft-label">{copy.draft}</span>
            <span>{copy.note}</span>
          </div>

          <nav className="legal-document-nav" aria-label={activeLanguage === "de" ? "Rechtliche Dokumente" : "Legal documents"}>
            {DOCUMENT_LINKS[activeLanguage].map((item) => (
              <Link
                href={item.href}
                key={item.href}
                aria-current={
                  (documentKey === "terms" && item.href.startsWith("/terms")) ||
                  (documentKey === "privacy" && item.href.startsWith("/privacy")) ||
                  (documentKey === "imprint" && item.href.startsWith("/imprint"))
                    ? "page"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
            <Link href="/">{copy.back}</Link>
          </nav>

          <aside className="legal-open-items">
            <h2>{copy.openTitle}</h2>
            <ul>
              {document.openItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <article className="legal-article">
            {document.sections.map((section) => (
              <section className="legal-section" key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </div>
      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          box-sizing: border-box;
          color: #f5f2ec;
          background:
            radial-gradient(ellipse at 18% 0%, rgba(var(--premivate-gold-rgb), 0.12), transparent 38%),
            linear-gradient(180deg, #0b0b0c 0%, #050505 72%);
          padding: 72px clamp(20px, 4.5vw, 72px) 76px;
        }

        .legal-shell {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
        }

        .legal-header {
          max-width: 1040px;
          margin-bottom: 30px;
        }

        .legal-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .legal-eyebrow {
          margin: 0;
          color: rgb(var(--premivate-gold-rgb));
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .legal-language,
        .legal-document-nav {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .legal-language a,
        .legal-document-nav a {
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 9px 14px;
          background: rgba(255, 255, 255, 0.035);
          font-size: 13px;
          font-weight: 700;
          transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
        }

        .legal-language a[aria-current="page"],
        .legal-document-nav a[aria-current="page"] {
          color: #17130c;
          border-color: transparent;
          background: linear-gradient(135deg, var(--premivate-gold-primary), var(--premivate-gold-highlight));
        }

        .legal-language a:hover,
        .legal-document-nav a:hover,
        .legal-language a:focus-visible,
        .legal-document-nav a:focus-visible {
          color: rgb(var(--premivate-gold-rgb));
          border-color: rgba(var(--premivate-gold-rgb), 0.52);
        }

        .legal-language a[aria-current="page"]:hover,
        .legal-document-nav a[aria-current="page"]:hover {
          color: #17130c;
        }

        h1 {
          max-width: 1000px;
          margin: 0 0 18px;
          font-size: clamp(40px, 6vw, 72px);
          line-height: 0.98;
          letter-spacing: -0.055em;
          font-weight: 900;
        }

        .legal-summary {
          max-width: 780px;
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: clamp(16px, 1.55vw, 20px);
          line-height: 1.55;
        }

        .legal-version {
          margin: 14px 0 0;
          color: rgba(255, 255, 255, 0.42);
          font-size: 13px;
        }

        .legal-draft-note {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 16px;
          margin: 28px 0 18px;
          padding: 16px 20px;
          border: 1px solid rgba(var(--premivate-gold-rgb), 0.32);
          border-radius: 16px;
          background: rgba(var(--premivate-gold-rgb), 0.075);
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.5;
        }

        .legal-draft-label {
          color: rgb(var(--premivate-gold-rgb));
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .legal-document-nav {
          margin-bottom: 26px;
        }

        .legal-open-items {
          margin: 0 0 30px;
          padding: clamp(20px, 3vw, 30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          background: rgba(18, 18, 19, 0.86);
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.22);
        }

        .legal-open-items h2 {
          margin: 0 0 14px;
          color: rgb(var(--premivate-gold-rgb));
          font-size: 15px;
          letter-spacing: 0.04em;
        }

        .legal-open-items ul {
          margin: 0;
          padding-left: 20px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          line-height: 1.7;
        }

        .legal-article {
          max-width: 1020px;
          display: grid;
          gap: 14px;
        }

        .legal-section {
          padding: clamp(20px, 3vw, 30px);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 18px;
          background: rgba(15, 15, 16, 0.88);
        }

        .legal-section h2 {
          margin: 0 0 14px;
          font-size: clamp(18px, 2vw, 22px);
          letter-spacing: -0.02em;
        }

        .legal-section p {
          margin: 0 0 12px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 15px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .legal-section p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 900px) {
          .legal-page {
            padding: 44px 20px 112px;
          }

          .legal-topline {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 20px;
          }

          .legal-document-nav a {
            padding: 8px 12px;
          }

          .legal-section p {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}
