const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const {
  asyncHookFun,
  commitActivityLog,
} = require("../context/requestContext");

const generalChat = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  asyncHookFun(req);

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    throw new AppError("message is required", 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI is not configured (OPENAI_API_KEY missing)", 503);
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-nano";

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful general knowledge assistant for college staff. Answer clearly and concisely. This is not RAG; use your general knowledge only.",
        },
        { role: "user", content: message },
      ],
    }),
  });
  console.log({ r });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const errMsg =
      json?.error?.message || r.statusText || "OpenAI request failed";
    throw new AppError(errMsg, 502);
  }

  const text = json?.choices?.[0]?.message?.content?.trim() || "";

  commitActivityLog({
    summary: "AI general question answered",
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
  });

  res.status(200).json({
    success: true,
    data: { reply: text },
  });
});

module.exports = { generalChat };
