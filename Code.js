/**
 * Pass State Engine for Eagle Hall Pass
 * Implements core pass creation, updates and closure logic.
 * Spec reference: "Pass State Logic" section lines 239-260.
 */

/**
 * Custom error types for better error handling and debugging
 */
class PassError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PassError';
    this.code = code;
    this.details = details;
  }
}

class PassValidationError extends PassError {
  constructor(code, message, details = {}) {
    super(code, message, details);
    this.name = 'PassValidationError';
  }
}

class PassNotFoundError extends PassError {
  constructor(passID) {
    super('PASS_NOT_FOUND', `Pass not found: ${passID}`, { passID });
    this.name = 'PassNotFoundError';
  }
}

function checkEmergencyMode() {
  if (getSetting('emergencyMode') === 'TRUE') {
    throw new Error('System is in emergency mode. Passes cannot be modified');
  }
}

function getCachedData(key) {
  const cache = PropertiesService.getScriptProperties();
  const data = cache.getProperty(CACHE_KEY_PREFIX + key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    if (Date.now() > parsed.expireAt) {
      cache.deleteProperty(CACHE_KEY_PREFIX + key);
      return null;
    }
    return parsed.value;
  } catch (e) {
    cache.deleteProperty(CACHE_KEY_PREFIX + key);
    return null;
  }
}

function getLongDurationThreshold() {
  const val = getSetting('longDurationThreshold');
  return val ? Number(val) : null;
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function appendPassLog(entry) {
  const sheet = getSheet(SHEETS.PASS_LOG);
  sheet.appendRow([
    entry.timestamp,
    entry.passID,
    entry.legID,
    entry.studentID,
    entry.state,
    entry.status,
    entry.staffID,
    entry.destinationID,
    entry.flag || '',
    entry.notes || ''
  ]);
}

function generatePassId() {
  return Utilities.getUuid();
}

function sanitizeForSheet(value) {
  if (typeof value !== 'string') return value;
  const first = value.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@') {
    return " '" + value;
  }
  return value;
}

function getCurrentStudentPass(studentID, csrfToken) {
  if (csrfToken !== getOrCreateCsrfToken()) {
    throw new Error('Invalid CSRF token');
  }

  const sheet = getSheet(SHEETS.ACTIVE_PASSES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]) === String(studentID)) {
      return {
        passID: row[0],
        studentID: row[1],
        staffID: row[3],
        destinationID: row[4],
        state: row[6],
        status: row[7],
        startTime: row[8]
      };
    }
  }
  return null;
}

function getCurrentStudentPassOptimized(studentID) {
  const cacheKey = 'STUDENT_PASS_' + studentID;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const pass = getCurrentStudentPass(studentID);

  const cache = PropertiesService.getScriptProperties();
  cache.setProperty(
    CACHE_KEY_PREFIX + cacheKey,
    JSON.stringify({ value: pass, expireAt: Date.now() + 30 * 1000 })
  );

  return pass;
}

function getAllActivePasses() {
  const sheet = getSheet(SHEETS.ACTIVE_PASSES);
  const data = sheet.getDataRange().getValues();
  const passes = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    passes.push({
      passID: row[0],
      studentID: row[1],
      originStaffID: row[2],
      staffID: row[3],
      destinationID: row[4],
      legID: row[5],
      state: row[6],
      status: row[7],
      startTime: row[8]
    });
  }
  return passes;
}
