const NEWS_KEY = "latest-news";
const REFRESH_SECRET = "simon-news-2026-utah";

const RSS_FEEDS = [
  {
    name: "Restaurant Business",
    url: "https://restaurantbusinessonline.com/rss.xml",
    category: "Restaurantes"
  },
  {
    name: "QSR Magazine",
    url: "https://www.qsrmagazine.com/rss.xml",
    category: "Restaurantes"
  },
  {
    name: "Food Business News",
    url: "https://www.foodbusinessnews.net/rss",
    category: "Ingredientes"
  },
  {
    name: "Baking Business",
    url: "https://www.bakingbusiness.com/rss",
    category: "Panadería"
  }
];

const DEFAULT_NEWS = {
  featured: {
    kicker: "Actualidad gastronómica",
    title: "Panorama editorial gastronómico",
    summary:
      "La sección editorial se actualiza automáticamente con una selección de noticias del sector gastronómico y alimentario.",
    whyItMatters:
      "Ayuda a mantener la sección activa mientras se consolidan fuentes y criterios editoriales.",
    publishedAt: new Date().toISOString(),
    sourceName: "Simon Angel Cooks",
    sourceUrl: "https://simonangelcooks.com/noticias"
  },
  latest: []
};

const KEYWORDS = [
  "food",
  "restaurant",
  "restaurants",
  "bakery",
  "baking",
  "bread",
  "pastry",
  "menu",
  "menus",
  "chef",
  "kitchen",
  "dining",
  "hospitality",
  "ingredient",
  "ingredients",
  "beverage",
  "beverages",
  "snack",
  "snacks",
  "grocery",
  "consumer",
  "culinary",
  "panadería",
  "panaderia",
  "pastelería",
  "pasteleria",
  "restaurante",
  "restaurantes",
  "gastronomía",
  "gastronomia",
  "alimentos",
  "comida",
  "insumos"
];

function jsonResponse(data, init = {}) {
  return Response.json(data, {
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "public, max-age=300"
    },
    ...init
  });
}

async function getStoredNews(env) {
  const stored = await env.NEWS_KV.get(NEWS_KEY, "json");
  return stored || DEFAULT_NEWS;
}

async function saveNews(env, payload) {
  await env.NEWS_KV.put(NEWS_KEY, JSON.stringify(payload));
}

function decodeXmlEntities(text = "") {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(text = "") {
  return decodeXmlEntities(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(regex);
  return match ? stripHtml(match[1]) : "";
}

function extractLink(block) {
  const rssLink = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (rssLink) return stripHtml(rssLink[1]);

  const atomLink = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atomLink) return atomLink[1].trim();

  return "";
}

function parseItemsFromXml(xml) {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  if (itemMatches.length > 0) {
    return itemMatches.map(parseSingleItem).filter(Boolean);
  }

  const entryMatches = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  return entryMatches.map(parseSingleEntry).filter(Boolean);
}

function parseSingleItem(itemXml) {
  const title = extractTag(itemXml, "title");
  const link = extractLink(itemXml);
  const description =
    extractTag(itemXml, "description") ||
    extractTag(itemXml, "content:encoded") ||
    extractTag(itemXml, "content");
  const pubDate =
    extractTag(itemXml, "pubDate") ||
    extractTag(itemXml, "dc:date") ||
    extractTag(itemXml, "published") ||
    extractTag(itemXml, "updated");

  if (!title || !link) return null;

  return {
    title,
    link,
    description,
    pubDate
  };
}

function parseSingleEntry(entryXml) {
  const title = extractTag(entryXml, "title");
  const link = extractLink(entryXml);
  const description =
    extractTag(entryXml, "summary") ||
    extractTag(entryXml, "content");
  const pubDate =
    extractTag(entryXml, "updated") ||
    extractTag(entryXml, "published");

  if (!title || !link) return null;

  return {
    title,
    link,
    description,
    pubDate
  };
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function includesKeyword(text = "") {
  const normalized = text.toLowerCase();
  return KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function createSummary(text = "") {
  const clean = stripHtml(text);
  if (!clean) {
    return "Resumen breve generado automáticamente a partir de la fuente original.";
  }
  return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
}

function guessKicker(sourceCategory, title, description) {
  const combined = `${title} ${description}`.toLowerCase();

  if (combined.includes("bakery") || combined.includes("baking") || combined.includes("bread") || combined.includes("pan")) {
    return "Panadería";
  }

  if (combined.includes("ingredient") || combined.includes("ingredients") || combined.includes("supply") || combined.includes("commodity")) {
    return "Ingredientes";
  }

  if (combined.includes("restaurant") || combined.includes("menu") || combined.includes("dining") || combined.includes("qsr")) {
    return "Restaurantes";
  }

  return sourceCategory || "Actualidad gastronómica";
}

function buildWhyItMatters(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (text.includes("price") || text.includes("cost") || text.includes("commodity") || text.includes("supply")) {
    return "Puede impactar costos, abastecimiento y toma de decisiones en negocios gastronómicos.";
  }

  if (text.includes("consumer") || text.includes("trend") || text.includes("demand")) {
    return "Ayuda a entender cambios en preferencias del consumidor y oportunidades de adaptación.";
  }

  if (text.includes("restaurant") || text.includes("menu") || text.includes("operator")) {
    return "Aporta contexto útil para operadores, propuestas de menú y experiencia del cliente.";
  }

  return "Aporta contexto útil para seguir tendencias relevantes en gastronomía, alimentos y hospitalidad.";
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        "user-agent": "SimonAngelCooksNewsBot/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Feed error ${response.status}`);
    }

    const xml = await response.text();
    const items = parseItemsFromXml(xml);

    return items.map((item) => ({
      sourceName: feed.name,
      sourceUrl: item.link,
      title: item.title,
      description: item.description,
      publishedAt: normalizeDate(item.pubDate),
      category: guessKicker(feed.category, item.title, item.description)
    }));
  } catch (error) {
    return [];
  }
}

async function buildNewsPayload() {
  const feedResults = await Promise.all(RSS_FEEDS.map(fetchFeed));
  const merged = feedResults.flat();

  const filtered = merged
    .filter((item) => includesKeyword(`${item.title} ${item.description}`))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (filtered.length === 0) {
    return DEFAULT_NEWS;
  }

  const featuredItem = filtered[0];
  const latestItems = filtered.slice(1, 4);

  return {
    featured: {
      kicker: featuredItem.category || "Actualidad gastronómica",
      title: featuredItem.title,
      summary: createSummary(featuredItem.description),
      whyItMatters: buildWhyItMatters(featuredItem),
      publishedAt: featuredItem.publishedAt,
      sourceName: featuredItem.sourceName,
      sourceUrl: featuredItem.sourceUrl
    },
    latest: latestItems.map((item) => ({
      kicker: item.category || "Actualidad gastronómica",
      title: item.title,
      summary: createSummary(item.description),
      publishedAt: item.publishedAt,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl
    }))
  };
}

async function refreshNews(env) {
  const payload = await buildNewsPayload();
  await saveNews(env, payload);
  return payload;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/news") {
      const news = await getStoredNews(env);
      return jsonResponse(news);
    }

    if (url.pathname === "/api/refresh-news") {
      const secret = url.searchParams.get("secret");

      if (secret !== REFRESH_SECRET) {
        return jsonResponse(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const updated = await refreshNews(env);

      return jsonResponse({
        ok: true,
        message: "Noticias actualizadas correctamente",
        data: updated
      });
    }

    if (url.pathname === "/api/seed-news") {
      await saveNews(env, DEFAULT_NEWS);

      return jsonResponse({
        ok: true,
        message: "Noticias iniciales guardadas en KV",
        data: DEFAULT_NEWS
      });
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshNews(env));
  }
};