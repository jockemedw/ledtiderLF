import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export async function getStaticProps() {
  const root = process.cwd();
  const sharedRaw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const pageRaw = fs.readFileSync(path.join(root, 'detaljplan.html'), 'utf-8');

  const sharedStyleMatch = sharedRaw.match(/<style>([\s\S]*?)<\/style>/);
  const sharedCss = sharedStyleMatch ? sharedStyleMatch[1] : '';

  return { props: { sharedCss, body: pageRaw } };
}

export default function Detaljplan({ sharedCss, body }) {
  return (
    <>
      <Head>
        <title>Detaljplaners ledtider — Lokalförsörjning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Nationella ledtider för detaljplaner i Sverige – SKR, Boverket, Bygg i Tid, Evidens. Vad som tar tid och varför."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: sharedCss }} />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}
