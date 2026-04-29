// Elementos del DOM
const newsList = document.getElementById("newsList");

const featuredKicker = document.getElementById("featuredKicker");
const featuredTitle = document.getElementById("featuredTitle");
const featuredSummary = document.getElementById("featuredSummary");
const featuredWhyItMatters = document.getElementById("featuredWhyItMatters");
const featuredDate = document.getElementById("featuredDate");
const featuredSource = document.getElementById("featuredSource");

// Formatea la fecha y hora en español
function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

// Crea una tarjeta de noticia para la lista de recientes
function createNewsCard(item) {
  const article = document.createElement("article");
  article.className = "news-card";

  article.innerHTML = `
    <p class="news-card__kicker">
      ${item.kicker ?? "Actualidad gastronómica"}
    </p>
    <h3>${item.title ?? "Sin título"}</h3>
    <p>${item.summary ?? ""}</p>
    <div class="news-meta">
      <span>Publicado: ${formatDate(item.publishedAt)}</span>
      <span>
        Fuente:
        <a href="${item.sourceUrl ?? "#"}"
           target="_blank"
           rel="noopener noreferrer">
          ${item.sourceName ?? "Leer fuente"}
        </a>
      </span>
    </div>
  `;

  return article;
}

// Rellena la noticia destacada
function renderFeatured(featured) {
  if (!featured) return;

  featuredKicker.textContent =
    featured.kicker ?? "Actualidad gastronómica";

  featuredTitle.textContent = featured.title ?? "Sin título";
  featuredSummary.textContent = featured.summary ?? "";

  featuredWhyItMatters.innerHTML = `
    <strong>Por qué importa:</strong>
    ${featured.whyItMatters ?? ""}
  `;

  featuredDate.textContent =
    `Publicado: ${formatDate(featured.publishedAt)}`;

  featuredSource.textContent = featured.sourceName ?? "Fuente";
  featuredSource.href = featured.sourceUrl ?? "#";
}

// Rellena la lista de noticias recientes
function renderLatest(items) {
  if (!newsList || !Array.isArray(items)) return;

  newsList.innerHTML = "";

  items.forEach((item) => {
    newsList.appendChild(createNewsCard(item));
  });
}

// Carga el JSON de noticias y actualiza la página
async function loadNews() {
  try {
    const response = await fetch("/data/news.json");

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    renderFeatured(data.featured);
    renderLatest(data.latest);
  } catch (error) {
    console.error("No se pudieron cargar las noticias:", error);
    // Aquí podrías mostrar un mensaje amable en la UI si quieres
  }
}

loadNews();