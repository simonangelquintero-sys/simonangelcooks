const NEWS_KEY = "latest-news";
const REFRESH_SECRET = "CAMBIA_ESTE_SECRETO";

const DEFAULT_NEWS = {
  featured: {
    kicker: "Actualidad gastronómica",
    title: "Cómo cambian las preferencias del consumidor en panadería artesanal",
    summary:
      "Un vistazo a cómo evolucionan los hábitos de compra, la valoración de ingredientes y la demanda de productos frescos y diferenciados.",
    whyItMatters:
      "Ayuda a negocios gastronómicos y panaderos a ajustar oferta, comunicación y estrategia de producto.",
    publishedAt: "2026-04-28T19:30:00Z",
    sourceName: "Fuente editorial de ejemplo",
    sourceUrl: "https://simonangelcooks.com/noticias.html"
  },
  latest: [
    {
      kicker: "Panadería",
      title: "Tendencias en panadería artesanal",
      summary:
        "Cambios en consumo, técnicas y preferencias de productos horneados.",
      publishedAt: "2026-04-28T15:00:00Z",
      sourceName: "Simon Angel Cooks",
      sourceUrl: "https://simonangelcooks.com/noticias.html"
    },
    {
      kicker: "Ingredientes",
      title: "Precios y abastecimiento de insumos",
      summary:
        "Panorama general de cómo se mueven costos clave para negocios de cocina y pastelería.",
      publishedAt: "2026-04-27T18:00:00Z",
      sourceName: "Simon Angel Cooks",
      sourceUrl: "https://simonangelcooks.com/noticias.html"
    },
    {
      kicker: "Restaurantes",
      title: "Nuevas ideas en menús y experiencias",
      summary:
        "Enfoques que están destacando por creatividad y conexión con el cliente.",
      publishedAt: "2026-04-26T16:30:00Z",
      sourceName: "Simon Angel Cooks",
      sourceUrl: "https://simonangelcooks.com/noticias.html"
    }
  ]
};

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

async function buildNewsPayload() {
  const now = new Date().toISOString();

  return {
    featured: {
      kicker: "Actualidad gastronómica",
      title: "Panorama editorial automatizado de prueba",
      summary:
        "Este contenido viene desde el Worker API y puede reemplazarse luego por noticias reales seleccionadas y resumidas.",
      whyItMatters:
        "Valida la arquitectura completa con Worker, KV, cron y consumo público desde /api/news.",
      publishedAt: now,
      sourceName: "Simon Angel Cooks",
      sourceUrl: "https://simonangelcooks.com/noticias.html"
    },
    latest: [
      {
        kicker: "Panadería",
        title: "Actualización automática de ejemplo 1",
        summary:
          "Noticia semilla generada por el Worker para comprobar el flujo de publicación.",
        publishedAt: now,
        sourceName: "Simon Angel Cooks",
        sourceUrl: "https://simonangelcooks.com/noticias.html"
      },
      {
        kicker: "Ingredientes",
        title: "Actualización automática de ejemplo 2",
        summary:
          "Segundo bloque de prueba para validar lectura desde Workers KV.",
        publishedAt: now,
        sourceName: "Simon Angel Cooks",
        sourceUrl: "https://simonangelcooks.com/noticias.html"
      },
      {
        kicker: "Restaurantes",
        title: "Actualización automática de ejemplo 3",
        summary:
          "Tercer bloque de prueba, listo para sustituirse por contenido real.",
        publishedAt: now,
        sourceName: "Simon Angel Cooks",
        sourceUrl: "https://simonangelcooks.com/noticias.html"
      }
    ]
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