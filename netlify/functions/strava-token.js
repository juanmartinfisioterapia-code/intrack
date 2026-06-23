// netlify/functions/strava-token.js
//
// Esta función vive en el servidor de Netlify, nunca en el navegador.
// Recibe el "code" que devuelve Strava tras autorizar, y hace el intercambio
// por el access_token usando el Client Secret guardado como variable de entorno.
// El secreto NUNCA llega al navegador del usuario.

exports.handler = async function (event) {
  // Solo aceptamos POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta el parámetro code" }),
      };
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Variables de entorno no configuradas en Netlify" }),
      };
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.message || "Error de Strava", details: data.errors }),
      };
    }

    // Solo devolvemos lo que el cliente necesita — nunca el client_secret
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        athlete: data.athlete,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
