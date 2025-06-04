// Data access and caching utilities for Eagle Hall Pass
// Provides helpers for retrieving data from Google Sheets
// and caching it in PropertiesService for performance.

const CACHE_KEY_PREFIX = 'EHP_CACHE_';
const CACHE_EXPIRATION_MINUTES = 5;
const ACTIVE_PASSES_SHEET = 'Active Passes';

const SHEETS = {
  STUDENTS: 'Student Data',
  TEACHERS: 'Teacher Data',
  SUPPORT: 'Support Data',
  ADMINS: 'Admin Data',
  SETTINGS: 'Settings',
  BELL_SCHEDULE: 'Bell Schedule'
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getCachedData(key) {
  const cache = PropertiesService.getScriptProperties();
  const data = cache.getProperty(CACHE_KEY_PREFIX + key);
  if (!data) return null;
  const parsed = JSON.parse(data);
  if (Date.now() > parsed.expireAt) {
    cache.deleteProperty(CACHE_KEY_PREFIX + key);
    return null;
  }
  return parsed.value;
}

function setCachedData(key, value) {
  const cache = PropertiesService.getScriptProperties();
  cache.setProperty(
    CACHE_KEY_PREFIX + key,
    JSON.stringify({ value: value, expireAt: Date.now() + CACHE_EXPIRATION_MINUTES * 60 * 1000 })
  );
}

function loadSheetData(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const objects = values.map(row => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
  setCachedData(sheetName, objects);
  return objects;
}

function getData(sheetName) {
  const cached = getCachedData(sheetName);
  if (cached) return cached;
  return loadSheetData(sheetName);
}

function findByEmail(sheetName, email) {
  const data = getData(sheetName);
  return data.find(r => String(r['studentEmail'] || r['staffEmail']).toLowerCase() === email.toLowerCase());
}

function getStudentByEmail(email) {
  return findByEmail(SHEETS.STUDENTS, email);
}

function getStudentById(id) {
  const data = getData(SHEETS.STUDENTS);
  return data.find(r => String(r.studentID) === String(id));
}

function getTeacherByEmail(email) {
  return findByEmail(SHEETS.TEACHERS, email);
}

function getTeacherById(id) {
  const data = getData(SHEETS.TEACHERS);
  return data.find(r => String(r.staffID) === String(id));
}

function getSupportByEmail(email) {
  return findByEmail(SHEETS.SUPPORT, email);
}

function getSupportById(id) {
  const data = getData(SHEETS.SUPPORT);
  return data.find(r => String(r.staffID) === String(id));
}

function getAdminByEmail(email) {
  return findByEmail(SHEETS.ADMINS, email);
}

function getAdminById(id) {
  const data = getData(SHEETS.ADMINS);
  return data.find(r => String(r.staffID) === String(id));
}

function getStaffRecordById(id) {
  const teacher = getTeacherById(id);
  if (teacher) return { type: 'teacher', record: teacher };
  const support = getSupportById(id);
  if (support) return { type: 'support', record: support };
  const admin = getAdminById(id);
  if (admin) return { type: 'admin', record: admin };
  return null;
}

function getSetting(key) {
  const data = getData(SHEETS.SETTINGS);
  const entry = data.find(r => r.settingKey === key);
  return entry ? entry.settingValue : null;
}

function getBellSchedule() {
  return getData(SHEETS.BELL_SCHEDULE);
}

function getCurrentPeriod() {
  const tz = getSetting('systemTimezone') || Session.getScriptTimeZone();
  const dayType = getSetting('dayType');
  const schedule = getBellSchedule().filter(p => !dayType || p.dayType === dayType);
  const nowStr = Utilities.formatDate(new Date(), tz, 'HH:mm');
  for (let i = 0; i < schedule.length; i++) {
    if (nowStr >= schedule[i].startTime && nowStr < schedule[i].endTime) {
      return schedule[i];
    }
  }
  return null;
}

function getNextPeriod() {
  const tz = getSetting('systemTimezone') || Session.getScriptTimeZone();
  const dayType = getSetting('dayType');
  const schedule = getBellSchedule().filter(p => !dayType || p.dayType === dayType);
  const nowStr = Utilities.formatDate(new Date(), tz, 'HH:mm');
  for (let i = 0; i < schedule.length; i++) {
    if (nowStr < schedule[i].startTime) {
      return schedule[i];
    }
  }
  return null;
}

function getStudentsForTeacherCurrentPeriod(staffID) {
  const current = getCurrentPeriod();
  if (!current) return [];
  const period = current.period;
  const students = getData(SHEETS.STUDENTS);
  return students.filter(s => String(s[period]) === String(staffID));
}

function getActivePassesForTeacher(staffID) {
  const classStudents = getStudentsForTeacherCurrentPeriod(staffID);
  const ids = classStudents.map(s => String(s.studentID));
  if (ids.length === 0) return [];
  const sheet = getSpreadsheet().getSheetByName(ACTIVE_PASSES_SHEET);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  rows.shift();
  return rows
    .filter(r => ids.includes(String(r[1])))
    .map(r => {
      const student = classStudents.find(s => String(s.studentID) === String(r[1]));
      return {
        passID: r[0],
        studentID: r[1],
        staffID: r[3],
        destinationID: r[4],
        legID: r[5],
        state: r[6],
        status: r[7],
        startTime: r[8],
        studentName: student ? student.firstName + ' ' + student.lastName : ''
      };
    });
}
