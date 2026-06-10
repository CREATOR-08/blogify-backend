const currentEvents = async (req, res) => {
  try {
    const country = String(req.body?.country || req.query?.country || "Worldwide").trim() || "Worldwide";
    const serviceUrl = process.env.BACKEND_AI_SERVICE || process.env.backend_ai_service;

    if (!serviceUrl) {
      return res.status(500).json({ message: "AI service URL is not configured." });
    }

    const endpoint = serviceUrl.replace(/\/$/, "");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const errorPayload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

      return res.status(response.status).json(
        typeof errorPayload === "object" && errorPayload !== null
          ? errorPayload
          : {
              message: "Failed to fetch current events.",
              details: errorPayload,
            }
      );
    }

    const data = contentType.includes("application/json")
      ? await response.json()
      : { data: await response.text() };

    return res.json(data);
  } catch (error) {
    console.error("Current events proxy failed:", error);
    return res.status(500).json({
      message: "Failed to fetch current events.",
      error: error.message,
    });
  }
};

module.exports = currentEvents;
