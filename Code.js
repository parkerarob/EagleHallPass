/**
 * Pass State Engine for Eagle Hall Pass
 * Implements core pass creation, updates and closure logic.
 * Spec reference: "Pass State Logic" section lines 239-260.
 */

const PASS_LOG_SHEET = 'Pass Log';
const ACTIVE_PASSES_SHEET = 'Active Passes';
const PERMANENT_RECORD_SHEET = 'Permanent Record';



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

/**
 * Checks if system is in emergency mode and throws appropriate error
 * @throws {Error} If system is in emergency mode
 */
function checkEmergencyMode() {
  if (getSetting('emergencyMode') === 'TRUE') {
    throw new Error('System is in emergency mode. Passes cannot be modified');
  }
}

/**
 * Get cached data from PropertiesService
 * @param {string} key - Cache key
 * @returns {*} Cached data or null if expired/missing
 */
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
    // Invalid JSON, clear it
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
  const sheet = getSheet(PASS_LOG_SHEET);
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

/**
 * Sanitizes input to prevent formula injection in Google Sheets
 * Uses a space prefix instead of quote to make it visible in tests
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
function sanitizeForSheet(value) {
  if (typeof value !== 'string') return value;
  const first = value.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@') {
    // Use space + quote to make it visible when read back from sheets
    return " '" + value;
  }
  return value;
}

function getCurrentStudentPass(studentID, csrfToken) {
  // Validate CSRF token
  if (csrfToken !== getOrCreateCsrfToken()) {
    throw new Error('Invalid CSRF token');
  }
  
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
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

/**
 * Get current student pass with caching
 * @param {string} studentID - Student ID to lookup
 * @returns {Object|null} Pass object or null
 */
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
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
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

/**
 * Creates a new hall pass for a student
 * @param {string} studentID - The student's ID
 * @param {string} originStaffID - The staff member creating the pass
 * @param {string} destinationID - Where the student is going
 * @param {string} notes - Additional notes for the pass
 * @returns {string} The generated pass ID
 * @throws {PassValidationError} If student already has an active pass
 * @throws {Error} If system is in emergency mode
 */
function openPass(studentID, originStaffID, destinationID, notes) {
  return monitorPerformance('openPass', () => {
    try {






      // Prevent pass changes if emergency mode is enabled
      checkEmergencyMode();
      
      // Prevent race conditions on rapid clicks
      const lockKey = 'PASS_LOCK_' + studentID;
      const lock = PropertiesService.getScriptProperties();
      const existingLock = lock.getProperty(lockKey);




      if (existingLock && (Date.now() - parseInt(existingLock)) < 5000) {
        throw new PassValidationError('RATE_LIMITED', 'Please wait before requesting another pass');
      }


      lock.setProperty(lockKey, Date.now().toString());












      try {
        // Existing duplicate check code stays here
        const sheet = getSheet(ACTIVE_PASSES_SHEET);
        const data = getActivePassesData();
        for (let i = 1; i < data.length; i++) {
          if (data[i][1] === studentID) {
            throw new PassValidationError(
              'DUPLICATE_PASS', 
              'Student already has an active pass',
              { studentID, existingPassID: data[i][0] }
            );
          }
        }
























        const passID = generatePassId();
        const now = new Date();
        const nowIso = now.toISOString();
        const safeDest = sanitizeForSheet(destinationID);
        const safeNotes = sanitizeForSheet(notes);
        const row = [
          passID,
          studentID,
          originStaffID,
          originStaffID,
          safeDest,
          1,
          'OPEN',
          'OUT',
          now
        ];
        
        // Use setValues instead of appendRow to preserve formatting
        retrySheetOperation(() => {
          const lastRow = sheet.getLastRow() + 1;
          sheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
        });

















        appendPassLog({
          timestamp: nowIso,
          passID: passID,
          legID: 1,
          studentID: studentID,
          state: 'OPEN',
          status: 'OUT',
          staffID: originStaffID,
          destinationID: safeDest,
          flag: '',
          notes: safeNotes
        });
        
        invalidateSmartCache('open', studentID);
        
        // Clear the lock on success
        lock.deleteProperty(lockKey);
        return passID;
        
      } catch (err) {
        // Clear the lock on error
        lock.deleteProperty(lockKey);
        throw err;
      }
    } catch (err) {


      Logger.log(err.stack || err.message);
      throw err;
    }
  });
}

function updatePassStatus(passID, status, locationID, staffID, flag, notes) {
  return monitorPerformance('updatePassStatus', () => {
    try {
    // Prevent pass changes if emergency mode is enabled
    checkEmergencyMode();
    const sheet = getSheet(ACTIVE_PASSES_SHEET);
    const data = getActivePassesData();
    let rowIndex = -1;
    let row;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === passID) {
        rowIndex = i + 1;
        row = data[i];
        break;
      }
    }
    if (rowIndex === -1) {
      throw new PassNotFoundError(passID);
    }

    const currentDestination = String(row[4]).toUpperCase();
    if (
      currentDestination === 'RESTROOM' &&
      (status === 'IN' || locationID !== row[4])
    ) {
      Logger.log(
        'Invalid update attempt on restroom pass ' +
          passID +
          ': status=' +
          status +
          ', destinationID=' +
          locationID
      );
      throw new PassValidationError(
        'INVALID_RESTROOM_UPDATE',
        'Restroom passes cannot be updated to IN status',
        { passID, currentDestination, attemptedStatus: status }
      );
    }

    const legID = Number(row[5]) + 1;
    const now = new Date().toISOString();
    const startTime = row[8];
    const elapsed = (new Date(now) - new Date(startTime)) / 60000;
    const threshold = getLongDurationThreshold();
    let finalFlag = flag;
    if (threshold && elapsed > threshold) {
      finalFlag = finalFlag ? finalFlag + ' LD' : 'LD';
    }

    const safeLoc = sanitizeForSheet(locationID);
    const safeNotes = sanitizeForSheet(notes);
    row[3] = staffID;
    row[4] = safeLoc;
    row[5] = legID;
    row[7] = status;
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);

    appendPassLog({
      timestamp: now,
      passID: passID,
      legID: legID,
      studentID: row[1],
      state: row[6],
      status: status,
      staffID: staffID,
      destinationID: safeLoc,
      flag: finalFlag,
      notes: safeNotes
    });
    invalidateSmartCache('update', row[1]);
  } catch (err) {
    Logger.log(err.stack || err.message);
    throw err;
  }
  });
}

function closePass(passID, closingStaffID, flag, notes) {
  return monitorPerformance('closePass', () => {
    try {
    // Prevent pass changes if emergency mode is enabled
    checkEmergencyMode();
    const sheet = getSheet(ACTIVE_PASSES_SHEET);
    const data = getActivePassesData();
    let rowIndex = -1;
    let row;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === passID) {
        rowIndex = i + 1;
        row = data[i];
        break;
      }
    }
    if (rowIndex === -1) {
      throw new PassNotFoundError(passID);
    }
    const now = new Date().toISOString();
    const legID = Number(row[5]) + 1;
    const startTime = row[8];
    const totalDuration = (new Date(now) - new Date(startTime)) / 60000;
    const threshold = getLongDurationThreshold();
    let finalFlag = flag;
    if (threshold && totalDuration > threshold) {
      finalFlag = finalFlag ? finalFlag + ' LD' : 'LD';
    }

    const safeNotes = sanitizeForSheet(notes);
    appendPassLog({
      timestamp: now,
      passID: passID,
      legID: legID,
      studentID: row[1],
      state: 'CLOSED',
      status: 'IN',
      staffID: closingStaffID,
      destinationID: row[4],
      flag: finalFlag,
      notes: safeNotes
    });

    const recordSheet = getSheet(PERMANENT_RECORD_SHEET);
    // Use setValues instead of appendRow to preserve sanitization formatting
    const recordLastRow = recordSheet.getLastRow() + 1;
    recordSheet.getRange(recordLastRow, 1, 1, 10).setValues([[
      passID,
      row[1],
      startTime,
      now,
      totalDuration,
      row[2],
      row[4],
      legID,
      finalFlag || '',
      safeNotes || ''
    ]]);

    sheet.deleteRow(rowIndex);
    invalidateSmartCache('close', row[1]);
  } catch (err) {
    Logger.log(err.stack || err.message);
    throw err;
  }
  });
}

function closePassStudent(passID, csrfToken) {
  // Validate CSRF token
  if (csrfToken !== getOrCreateCsrfToken()) {
    throw new Error('Invalid CSRF token');
  }
  
  // Get the pass to find the student
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = getActivePassesData();
  let passRow = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === passID) {
      passRow = data[i];
      break;
    }
  }
  
  if (!passRow) {
    throw new PassNotFoundError(passID);
  }
  
  const studentID = passRow[1];
  const currentStaffID = passRow[3];
  
  // Use existing closePass function
  closePass(passID, currentStaffID, '', 'Student self-close');
  
  return null; // Student expects null after closing
}

function autoClosePasses() {
  try {
    const current = getCurrentPeriod();
    const next = getNextPeriod();
    Logger.log(
      'Auto-closing passes. Current: ' +
        (current ? current.period : 'N/A') +
        ' Next: ' +
        (next ? next.period : 'N/A')
    );

    const sheet = getSheet(ACTIVE_PASSES_SHEET);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const passID = row[0];
      const status = row[7];
      const staffID = row[3];

      const staff = getStaffRecordById(staffID);

      if (status === 'OUT') {
        closePass(passID, staffID, 'autoClose', 'Period change');
        continue;
      }

      if (!staff) {
        closePass(passID, staffID, 'autoClose', 'Period change');
        continue;
      }

      if (staff.type === 'support') {
        const override =
          String(staff.record.periodOverride).toUpperCase() === 'TRUE';
        if (!override) {
          closePass(passID, staffID, 'autoClose', 'Period change');
        }
      } else {
        closePass(passID, staffID, 'autoClose', 'Period change');
      }
    }
  } catch (err) {
    Logger.log(err.stack || err.message);
    throw err;
  }
}

function getOutStudents() {
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[7] === 'OUT') {
      const student = getStudentById(row[1]);
      if (student) {
        out.push(student);
      }
    }
  }
  return out;
}

// ADD this performance optimization helper:

/**
 * Get active passes data with caching to reduce sheet reads
 * @returns {Array} Active passes data array
 */
function getActivePassesData() {
  const cacheKey = 'ACTIVE_PASSES_DATA';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // Cache for 1 minute (shorter than other caches due to frequent updates)
  const cache = PropertiesService.getScriptProperties();
  cache.setProperty(
    CACHE_KEY_PREFIX + cacheKey,
    JSON.stringify({ 
      value: data, 
      expireAt: Date.now() + 60 * 1000 // 1 minute cache
    })
  );
  
  return data;
}

/**
 * Invalidate active passes cache when data changes
 */
/**
 * Smart cache invalidation - only invalidate what changed
 * @param {string} operation - Type of operation performed
 * @param {string} studentID - Student ID if relevant
 */
function invalidateSmartCache(operation, studentID = null) {
  const cache = PropertiesService.getScriptProperties();

  cache.deleteProperty(CACHE_KEY_PREFIX + 'ACTIVE_PASSES_DATA');

  if (studentID) {
    cache.deleteProperty(CACHE_KEY_PREFIX + 'STUDENT_PASS_' + studentID);
  }

  if (operation === 'open' || operation === 'close') {
    const keys = cache.getKeys();
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX + 'TEACHER_PASSES_')) {
        cache.deleteProperty(key);
      }
    });
  }
}

/**
 * Batch sheet operations to reduce API calls
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target sheet
 * @param {Array} operations - Array of {type: 'append'|'update'|'delete', data: any, range?: string}
 */
function batchSheetOperations(sheet, operations) {
  const updates = [];
  const appends = [];

  operations.forEach(op => {
    if (op.type === 'append') {
      appends.push(op.data);
    } else if (op.type === 'update') {
      updates.push({ range: op.range, values: op.data });
    }
  });

  if (appends.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, appends.length, appends[0].length).setValues(appends);
  }

  if (updates.length > 0) {
    updates.forEach(update => {
      sheet.getRange(update.range).setValues(update.values);
    });
  }

  return;
}

/**
 * Retry wrapper for sheet operations that might fail due to rate limits
 * @param {Function} operation - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {*} Result of the operation
 */
function retrySheetOperation(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      if (error instanceof PassValidationError || error instanceof PassNotFoundError) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      Logger.log(`Sheet operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms: ${error.message}`);
      if (attempt < maxRetries - 1) {
        Utilities.sleep(delay);
      }
    }
  }
  throw new Error(`Sheet operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Performance monitoring wrapper
 * @param {string} operationName - Name of the operation
 * @param {Function} operation - Function to monitor
 * @returns {*} Result of the operation
 */
function monitorPerformance(operationName, operation) {
  const startTime = Date.now();
  try {
    const result = operation();
    const duration = Date.now() - startTime;
    if (duration > 2000) {
      Logger.log(`SLOW OPERATION: ${operationName} took ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.log(`FAILED OPERATION: ${operationName} failed after ${duration}ms: ${error.message}`);
    throw error;
  }
}

// ADD these batch operation functions:

/**
 * Closes multiple passes in a single operation for better performance
 * @param {Array<string>} passIDs - Array of pass IDs to close
 * @param {string} closingStaffID - Staff member closing the passes
 * @param {string} reason - Reason for bulk closure (e.g., "Period change")
 * @returns {Object} Results summary with success/failure counts
 */
function bulkClosePasses(passIDs, closingStaffID, reason = '') {
  const results = { success: 0, failed: 0, errors: [] };
  
  // Process in batches to avoid timeout
  const batchSize = 10;
  for (let i = 0; i < passIDs.length; i += batchSize) {
    const batch = passIDs.slice(i, i + batchSize);
    
    batch.forEach(passID => {
      try {
        closePass(passID, closingStaffID, 'bulkClose', reason);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ passID, error: error.message });
      }
    });
    
    // Brief pause between batches to prevent rate limiting
    if (i + batchSize < passIDs.length) {
      Utilities.sleep(100);
    }
  }
  
  return results;
}

/**
 * Enhanced auto-close with better error handling and reporting
 * @returns {Object} Summary of auto-close operation
 */
function autoClosePassesEnhanced() {
  try {
    const current = getCurrentPeriod();
    const next = getNextPeriod();
    Logger.log(
      `Auto-closing passes. Current: ${current ? current.period : 'N/A'} Next: ${next ? next.period : 'N/A'}`
    );

    const data = getActivePassesData();
    const passesToClose = [];
    
    // Collect passes that need to be closed
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const passID = row[0];
      const status = row[7];
      const staffID = row[3];

      const staff = getStaffRecordById(staffID);

      if (status === 'OUT') {
        passesToClose.push(passID);
        continue;
      }

      if (!staff) {
        passesToClose.push(passID);
        continue;
      }

      if (staff.type === 'support') {
        const override = String(staff.record.periodOverride).toUpperCase() === 'TRUE';
        if (!override) {
          passesToClose.push(passID);
        }
      } else {
        passesToClose.push(passID);
      }
    }
    
    // Use bulk close for better performance
    const results = bulkClosePasses(passesToClose, 'SYSTEM', 'Period change');
    Logger.log(`Auto-close completed: ${results.success} closed, ${results.failed} failed`);
    
    return results;
  } catch (err) {
    Logger.log(`Auto-close error: ${err.stack || err.message}`);
    throw err;
  }
}

function requestPass(studentID, destination, csrfToken) {
  // Validate CSRF token
  if (csrfToken !== getOrCreateCsrfToken()) {
    throw new Error('Invalid CSRF token');
  }
  
  // Validate student exists and get their current teacher
  const student = getStudentById(studentID);
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Get current period to determine origin staff
  const currentPeriod = getCurrentPeriod();
  if (!currentPeriod) {
    throw new Error('No active period - cannot create pass');
  }
  
  // Get the teacher for current period
  const originStaffID = student[currentPeriod.period];
  if (!originStaffID) {
    throw new Error('No teacher assigned for current period');
  }
  
  // Create the pass using existing openPass function
  const passID = openPass(studentID, originStaffID, destination, 'Student self-request');
  
  // Return the created pass
  return getCurrentStudentPass(studentID, csrfToken);
}
