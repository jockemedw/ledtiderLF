import Head from 'next/head';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';
import dynamic from 'next/dynamic';
import Kallhanvisningar from '../components/Kallhanvisningar.jsx';
import { byggKallindex } from '../lib/kallhanvisning.js';

const CommentLayer = dynamic(() => import('../components/CommentLayer.jsx'), { ssr: false });
const PickMode = dynamic(() => import('../components/PickMode.jsx'), { ssr: false });

export async function getStaticProps() {
  const root = process.cwd();
  const htmlPath = path.join(root, 'lokalforsorjning.html');
  const raw = fs.readFileSync(htmlPath, 'utf-8');

  const kallindex = byggKallindex(
    JSON.parse(fs.readFileSync(path.join(root, 'data/kallregister.json'), 'utf-8')),
    JSON.parse(fs.readFileSync(path.join(root, 'data/siffror.json'), 'utf-8'))
  );

  const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let bodyInnehall = bodyMatch ? bodyMatch[1] : '';

  const scriptMatch = bodyInnehall.match(/<script>([\s\S]*?)<\/script>/);
  let scriptInnehall = scriptMatch ? scriptMatch[1] : '';

  bodyInnehall = bodyInnehall.replace(/<script>[\s\S]*?<\/script>/, '');

  scriptInnehall = scriptInnehall.replace(
    /document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/,
    '(function initDirect() {\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", initDirect);\n    return;\n  }\n$1\n})();'
  );

  return { props: { css, bodyInnehall, scriptInnehall, kallindex } };
}

export default function Home({ css, bodyInnehall, scriptInnehall, kallindex }) {
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

      <Script
        id="lokal-data-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: scriptInnehall }}
      />

      <Kallhanvisningar index={kallindex} />
      <CommentLayer />
      <PickMode />
    </>
  );
}
