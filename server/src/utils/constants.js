const ROLE = {
  STUDENT: "student",
  STAFF: "staff",
  ADMIN: "admin",
  SUPER_ADMIN: "super admin",
  INCHARGE: "incharge",
  HOD: "hod",
};

const DEGREE = {
  BSC: "bsc",
  MSC: "msc",
  BA: "ba",
  MA: "ma",
  SCHOLAR: "scholar",
  BCOM: "bcom",
  BBA: "bba",
  BCA: "bca",
  MCA: "mca",
};

const DEPARTMENT = {
  COMPUTER_SCIENCE: "computer science",
  TAMIL: "tamil",
  ENGLISH: "english",
  MATHS: "maths",
  PHYSICS: "physics",
  CHEMISTRY: "chemistry",
  HISTORY: "history",
  CORPORATE: "corporate",
  GENERAL: "general",
  MCA: "mca",
};

const YEARANDSEMESTER = {
  YEAR1: "year 1",
  YEAR2: "year 2",
  YEAR3: "year 3",
  SEM1: "sem 1",
  SEM2: "sem 2",
};

/** Staff approval lifecycle (also used where legacy data has no status). */
const USER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

module.exports = { ROLE, DEGREE, DEPARTMENT, YEARANDSEMESTER, USER_STATUS };
