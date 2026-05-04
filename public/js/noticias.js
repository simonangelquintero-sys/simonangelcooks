const newsList = document.getElementById("newsList");

const featuredKicker = document.getElementById("featuredKicker");
const featuredTitle = document.getElementById("featuredTitle");
const featuredSummary = document.getElementById("featuredSummary");
const featuredWhyItMatters = document.getElementById("featuredWhyItMatters");
const featuredDate = document.getElementById("featuredDate");
const featuredSource = document.getElementById("featuredSource");

const decodeHtmlEntities = (() => {
  const textarea = document.createElement("textarea");
  return (value) => {
    if (typeof value !== "string") return value ?? "";
    textarea.innerHTML = value;
    return textarea.value;
  };
})();
function decodeHtmlEntities(value) {
  if (typeof value !== "string") return value ?? "";

  const textarea = document.createElement("textarea");
  let decoded = value;
  let previous = "";

  while (decoded !== previous) {
    previous = decoded;
    textarea.innerHTML = decoded;
    decoded = textarea.value;
  }

  return decoded;
}
function formatDate(dateString) {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function createNewsCard(item) {
  const article = document.createElement("article");
  article.className = "news-card";

  const kicker = document.createElement("p");
  kicker.className = "news-card__kicker";
  kicker.textContent = decodeHtmlEntities(item.kicker ?? "Actualidad gastronómica");

  const title = document.createElement("h3");
  title.textContent = decodeHtmlEntities(item.title ?? "Sin título");

  const summary = document.createElement("p");
  summary.textContent = decodeHtmlEntities(item.summary ?? "");

  const meta = document.createElement("div");
  meta.className = "news-meta";

  const published = document.createElement("span");
  published.textContent = `Publicado: ${formatDate(item.publishedAt)}`;

  const sourceWrap = document.createElement("span");
  sourceWrap.append("Fuente: ");

  const sourceLink = document.createElement("a");
  sourceLink.href = item.sourceUrl ?? "#";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = decodeHtmlEntities(item.sourceName ?? "Leer fuente");

  sourceWrap.appendChild(sourceLink);
  meta.appendChild(published);
  meta.appendChild(sourceWrap);

  article.appendChild(kicker);
  article.appendChild(title);
  article.appendChild(summary);
  article.appendChild(meta);

  return article;
}

function renderFeatured(featured) {
  if (!featured) return;

  featuredKicker.textContent = decodeHtmlEntities(
    featured.kicker ?? "Actualidad gastronómica"
  );
  featuredTitle.textContent = decodeHtmlEntities(
    featured.title ?? "Sin título"
  );
  featuredSummary.textContent = decodeHtmlEntities(
    featured.summary ?? ""
  );

  featuredWhyItMatters.innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = "Por qué importa:";
  featuredWhyItMatters.appendChild(strong);
  featuredWhyItMatters.append(" ");
  featuredWhyItMatters.append(
    decodeHtmlEntities(featured.whyItMatters ?? "")
  );

  featuredDate.textContent = `Publicado: ${formatDate(featured.publishedAt)}`;
  featuredSource.textContent = decodeHtmlEntities(
    featured.sourceName ?? "Fuente"
  );
  featuredSource.href = featured.sourceUrl ?? "#";
}

function renderLatest(items) {
  if (!newsList || !Array.isArray(items)) return;

  newsList.innerHTML = "";
  items.forEach((item) => {
    newsList.appendChild(createNewsCard(item));
  });
}

async function loadNews() {
  try {
    const response = await fetch("/api/news");

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    renderFeatured(data.featured);
    renderLatest(data.latest);
  } catch (error) {
    console.error("No se pudieron cargar las noticias:", error);

    if (newsList) {
      newsList.innerHTML = `
        <article class="news-card">
          <p class="news-card__kicker">Aviso</p>
          <h3>No se pudieron cargar las noticias</h3>
          <p>Intenta nuevamente en unos minutos.</p>
        </article>
      `;
    }

    if (featuredTitle) {
      featuredTitle.textContent = "Noticias no disponibles temporalmente";
    }
    if (featuredSummary) {
      featuredSummary.textContent =
        "Hubo un problema al cargar el contenido más reciente.";
    }
    if (featuredWhyItMatters) {
      featuredWhyItMatters.textContent = "";
    }
    if (featuredDate) {
      featuredDate.textContent = "";
    }
    if (featuredSource) {
      featuredSource.textContent = "";
      featuredSource.removeAttribute("href");
    }
  }
}

loadNews();