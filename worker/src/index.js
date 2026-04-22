function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": "*"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type"
        }
      });
    }

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          service: env.APP_NAME || "news-service"
        });
      }

      if (url.pathname === "/api/news/published" && request.method === "GET") {
        const { results } = await env.DB.prepare(`
          SELECT id, title, slug, summary, why_it_matters, source_name, source_url, published_at
          FROM news_items
          WHERE status = 'published'
          ORDER BY published_at DESC
          LIMIT 20
        `).all();

        return json({
          ok: true,
          items: results
        });
      }

      if (url.pathname === "/api/news/drafts" && request.method === "GET") {
        const { results } = await env.DB.prepare(`
          SELECT id, title, slug, summary, source_name, source_url, status, created_at
          FROM news_items
          WHERE status IN ('draft', 'pending_review', 'approved', 'rejected')
          ORDER BY created_at DESC
          LIMIT 50
        `).all();

        return json({
          ok: true,
          items: results
        });
      }

      if (url.pathname === "/api/news/seed" && request.method === "POST") {
        const now = new Date().toISOString();
        const slug = "ejemplo-noticia-gastronomica";

        await env.DB.prepare(`
          INSERT OR IGNORE INTO news_items
          (title, slug, summary, why_it_matters, source_name, source_url, status, created_at, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          "Ejemplo de noticia gastronómica",
          slug,
          "Este es un resumen de prueba para validar la arquitectura inicial de noticias gastronómicas.",
          "Sirve para probar el flujo público del sitio antes de conectar automatizaciones y revisión editorial.",
          "Fuente de ejemplo",
          "https://example.com/noticia",
          "published",
          now,
          now
        ).run();

        return json({
          ok: true,
          message: "Noticia de prueba creada"
        });
      }

      return json({
        ok: false,
        error: "Ruta no encontrada"
      }, 404);
    } catch (error) {
      return json({
        ok: false,
        error: error.message || "Error interno del servidor"
      }, 500);
    }
  }
};