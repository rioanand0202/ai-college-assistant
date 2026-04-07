const GoogleStrategy = require("passport-google-oauth20").Strategy;
const OAuthUser = require("../models/OAuthUser.model");

/**
 * @param {import('passport')} passport
 */
module.exports = function configureGooglePassport(passport) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.warn(
      "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || "";
          const name = profile.displayName || email || "User";
          if (!email) {
            return done(new Error("Google account has no email"));
          }

          let user = await OAuthUser.findOne({ googleId });
          if (!user) {
            user = await OAuthUser.create({
              googleId,
              email: email.toLowerCase(),
              name,
              provider: "google",
            });
          } else {
            user.name = name || user.name;
            user.email = email.toLowerCase();
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const u = await OAuthUser.findById(id);
      done(null, u);
    } catch (e) {
      done(e);
    }
  });
};
