const { catchAsync } = require("../utils/catchAsync");

const getOAuthMe = catchAsync(async (pick, res) => {
  const { req } = pick;
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.oauthUser.id,
        email: req.oauthUser.email,
        name: req.oauthUser.name,
        provider: req.oauthUser.provider,
      },
    },
  });
});

module.exports = { getOAuthMe };
