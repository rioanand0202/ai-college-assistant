const { runPublicAsk } = require("../services/publicAssistant.service");
const { resolveOAuthUserFromToken } = require("../middlewares/oauthAuth.middleware");

/**
 * @param {import('socket.io').Socket} socket
 */
function attachPublicChatSocket(socket) {
  const rawToken =
    socket.handshake.auth?.token ||
    (typeof socket.handshake.headers?.authorization === "string"
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
      : null);

  socket.on("public:ask", async (payload, ack) => {
    const question = payload?.question;
    const clientMsgId = payload?.clientMsgId || null;

    const reply = (obj) => {
      const out = { clientMsgId, ...obj };
      if (typeof ack === "function") {
        ack(out);
      } else {
        socket.emit("public:ask:result", out);
      }
    };

    try {
      if (!question || !String(question).trim()) {
        reply({ success: false, message: "question is required" });
        return;
      }

      const oauthUser = await resolveOAuthUserFromToken(
        typeof rawToken === "string" ? rawToken : null,
      );

      const data = await runPublicAsk({
        question: String(question).trim(),
        oauthUser,
      });

      reply({ success: true, data });
    } catch (err) {
      const status = err?.statusCode || 502;
      const message = err?.message || "Assistant request failed";
      reply({ success: false, message, status });
    }
  });
}

module.exports = { attachPublicChatSocket };
