const { DEGREE, DEPARTMENT, YEARANDSEMESTER } = require("../utils/constants");
const { catchAsync } = require("../utils/catchAsync");

const getMeta = catchAsync(async (_pick, res) => {
  const { YEAR1, YEAR2, YEAR3, SEM1, SEM2 } = YEARANDSEMESTER;
  res.status(200).json({
    success: true,
    data: {
      degrees: Object.values(DEGREE),
      departments: Object.values(DEPARTMENT),
      years: [YEAR1, YEAR2, YEAR3],
      semesters: [SEM1, SEM2],
    },
  });
});

module.exports = { getMeta };
