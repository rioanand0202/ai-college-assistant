const Joi = require("joi");

const ymd = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required()
  .messages({ "string.pattern.base": "Use YYYY-MM-DD for dates" });

const ymdOptional = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .allow("");

const createEventAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().allow("").max(8000).default(""),
  kind: Joi.string().valid("event", "announcement").required(),
  linkUrl: Joi.string().trim().allow("").max(2000).default(""),
  isSingleDay: Joi.boolean().default(true),
  eventDate: ymd,
  eventEndDate: Joi.when("isSingleDay", {
    is: false,
    then: ymd,
    otherwise: ymdOptional,
  }),
});

module.exports = { createEventAnnouncementSchema };
