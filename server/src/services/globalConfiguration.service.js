const GlobalConfiguration = require("../models/GlobalConfiguration.model");

const getGlobalConfiguration = async () => {
  let doc = await GlobalConfiguration.findOne({ key: "default" });
  if (!doc) {
    doc = await GlobalConfiguration.create({ key: "default", mfaOn: false });
  }
  return doc;
};

const ensureGlobalConfiguration = async () => {
  await GlobalConfiguration.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { mfaOn: false } },
    { upsert: true, new: true },
  );
};

module.exports = { getGlobalConfiguration, ensureGlobalConfiguration };
