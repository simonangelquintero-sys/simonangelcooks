async function loadNews() {
  const container = document.getElementById("newsList");

  if (!container) return;

  try {
    const res = await fetch("/api/news/published");
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.items) || data.items.length === 0) {
      container.innerHTML = `
        <article class="news-card">
          <h2>Aún no hay noticias publicadas</h2>
          <p>Pronto verás aquí resúmenes gastronómicos revisados y aprobados.</p>
        </article>
      `;
      return;
    }

    container.innerHTML = data.items.map(item => `
      <article class="news-card">
        <h2>${item.title}</h2>
        <p>${item.summary}</p>
        ${item.why_it_matters ? `<p><strong>Por qué importa:</strong> ${item.why_it_matters}</p>` : ""}
        <p>
          <strong>Fuente:</strong>
          <a href="${item.source_url}" target="_blank" rel="noopener noreferrer">${item.source_name}</a>
        </p>
        <p><small>Publicado: ${item.published_at ? new Date(item.published_at).toLocaleString("es-US") : "Sin fecha"}</small></p>
      </article>
    `).join("");
  } catch (error) {
    container.innerHTML = `
      <article class="news-card">
        <h2>Error al cargar noticias</h2>
        <p>No pudimos obtener las noticias en este momento.</p>
      </article>
    `;
  }
}

loadNews();