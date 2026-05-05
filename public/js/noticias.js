const newsList = document.getElementById("newsList");

const featuredKicker = document.getElementById("featuredKicker");
const featuredTitle = document.getElementById("featuredTitle");
const featuredSummary = document.getElementById("featuredSummary");
const featuredWhyItMatters = document.getElementById("featuredWhyItMatters");
const featuredDate = document.getElementById("featuredDate");
const featuredSource = document.getElementById("featuredSource");

if (!newsList) {
  console.error("Elemento #newsList no encontrado en el DOM");
}

const textarea = document.createElement("textarea");

function decodeHtmlEntities(value) {
  if (value == null) return "";

  let text = String(value);

  for (let i = 0; i < 6; i++) {
    const previous = text;

    text = text
      .replace(/&#(\d+);?/g, (_, code) => `&#${code};`)
      .replace(/&#x([0-9a-fA-F]+);?/g, (_, code) => `&#x${code};`)
      .replace(/&(amp|#38);#(\d+);?/gi, (_, __, code) => `&#${code};`)
      .replace(/&(amp|#38);#x([0-9a-fA-F]+);?/gi, (_, __, code) => `&#x${code};`)
      .replace(/&amp;/gi, "&");

    textarea.innerHTML = text;
    text = textarea.value;

    if (text === previous) break;
  }

  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value, fallback = "") {
  const text = decodeHtmlEntities(value);
  return text || fallback;
}

function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.href;
  } catch {
    return "#";
  }
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
  kicker.textContent = item.kicker || "Actualidad gastronómica";

  const title = document.createElement("h3");
  title.textContent = item.title || "Sin título";

  const summary = document.createElement("p");
  summary.textContent = item.summary || "";

  const meta = document.createElement("div");
  meta.className = "news-meta";

  // FECHA
  const published = document.createElement("span");
  published.className = "news-meta__date";
  const dateStr = formatDate(item.publishedAt);
  published.textContent = `Publicado: ${dateStr}`;

  // FUENTE con enlace real
  const sourceWrap = document.createElement("span");
  sourceWrap.className = "news-meta__source";
  sourceWrap.append("Fuente: ");

  const sourceLink = document.createElement("a");
  const sourceUrl = item.sourceUrl;
  sourceLink.href = sourceUrl && sourceUrl !== "#" ? sourceUrl : "#";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = item.sourceName || "Leer fuente";
  sourceLink.className = "news-meta__source-link";

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
  if (!featured || !featuredTitle || !featuredSummary) return;

  if (featuredKicker) {
    featuredKicker.textContent = cleanText(
      featured.kicker,
      "Actualidad gastronómica"
    );
  }

  featuredTitle.textContent = cleanText(featured.title, "Sin título");
  featuredSummary.textContent = cleanText(featured.summary, "");

  if (featuredWhyItMatters) {
    featuredWhyItMatters.replaceChildren();

    const why = cleanText(featured.whyItMatters, "");
    if (why) {
      const strong = document.createElement("strong");
      strong.textContent = "Por qué importa:";
      featuredWhyItMatters.appendChild(strong);
      featuredWhyItMatters.append(" ", why);
    }
  }

  if (featuredDate) {
    featuredDate.textContent = `Publicado: ${formatDate(featured.publishedAt)}`;
  }

  if (featuredSource) {
    featuredSource.textContent = cleanText(featured.sourceName, "Fuente");
    featuredSource.href = safeUrl(featured.sourceUrl);
  }
}

function renderLatest(items) {
  if (!newsList || !Array.isArray(items)) return;

  newsList.replaceChildren();

  if (items.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "No hay noticias disponibles.";
    newsList.appendChild(emptyMsg);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    fragment.appendChild(createNewsCard(item));
  });

  newsList.appendChild(fragment);
}

function renderErrorState() {
  if (newsList) {
    newsList.replaceChildren();

    const article = document.createElement("article");
    article.className = "news-card";

    const kicker = document.createElement("p");
    kicker.className = "news-card__kicker";
    kicker.textContent = "Aviso";

    const title = document.createElement("h3");
    title.textContent = "No se pudieron cargar las noticias";

    const msg = document.createElement("p");
    msg.textContent = "Intenta nuevamente en unos minutos.";

    article.appendChild(kicker);
    article.appendChild(title);
    article.appendChild(msg);

    newsList.appendChild(article);
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

function renderLoading() {
  if (!newsList) return;

  newsList.replaceChildren();

  const loading = document.createElement("p");
  loading.textContent = "Cargando noticias...";
  newsList.appendChild(loading);
}

async function loadNews() {
  renderLoading();

  try {
    const response = await fetch("/api/news");

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    console.log("Noticias API:", data);

    renderFeatured(data.featured);
    renderLatest(data.latest);
  } catch (error) {
    console.error("No se pudieron cargar las noticias:", error);
    renderErrorState();
  }
}

loadNews();