import Giscus from '@giscus/react';

// Comentarios con Giscus: cada post es una Discussion en DidierParody/Dipper
// (categoría Announcements: solo el autor y la app de Giscus pueden abrir hilos).
// Los ids son públicos; se obtienen del repo con la API GraphQL de GitHub.
const REPO = 'DidierParody/Dipper';
const REPO_ID = 'R_kgDOTMIE4g';
const CATEGORY = 'Announcements';
const CATEGORY_ID = 'DIC_kwDOTMIE4s4DGqb8';

export default function Comments({ slug }: { slug: string }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2
        style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 700,
          fontSize: 17,
          margin: '0 0 16px',
        }}
      >
        Comentarios
      </h2>
      <Giscus
        repo={REPO}
        repoId={REPO_ID}
        category={CATEGORY}
        categoryId={CATEGORY_ID}
        // El hilo se liga al slug (no a la URL), así sobrevive a cambios de dominio.
        mapping="specific"
        term={slug}
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="transparent_dark"
        lang="es"
        loading="lazy"
      />
    </section>
  );
}
