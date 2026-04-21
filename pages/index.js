import Head from 'next/head';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';

export async function getStaticProps() {
  const htmlPath = path.join(process.cwd(), 'lokalforsorjning.html');
  const raw = fs.readFileSync(htmlPath, 'utf-8');

  // Extrahera CSS (allt mellan <style> och </style>, första träffen)
  const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  // Extrahera body-innehåll (allt mellan <body...> och </body>)
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let bodyInnehall = bodyMatch ? bodyMatch[1] : '';

  // Extrahera det inbäddade <script>-blocket i body (DATA + render-funktioner)
  const scriptMatch = bodyInnehall.match(/<script>([\s\S]*?)<\/script>/);
  let scriptInnehall = scriptMatch ? scriptMatch[1] : '';

  // Ta bort script-taggen från body
  bodyInnehall = bodyInnehall.replace(/<script>[\s\S]*?<\/script>/, '');

  // VIKTIGT: Next.js <Script strategy="afterInteractive"> laddas EFTER att
  // DOMContentLoaded har triggats, så en listener på det eventet kommer aldrig
  // köras. Vi omvandlar DOMContentLoaded-wrappern till direkt anrop.
  scriptInnehall = scriptInnehall.replace(
    /document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/,
    '(function initDirect() {\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", initDirect);\n    return;\n  }\n$1\n})();'
  );

  return {
    props: { css, bodyInnehall, scriptInnehall },
  };
}

export default function Home({ css, bodyInnehall, scriptInnehall }) {
  return (
    <>
      <Head>
        <title>Lokalförsörjning — Från behov till inflyttning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </Head>

      <div dangerouslySetInnerHTML={{ __html: bodyInnehall }} />

      {/* Original-scriptet (DATA + render-funktioner) */}
      <Script
        id="lokal-data-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: scriptInnehall }}
      />
    </>
  );
}
