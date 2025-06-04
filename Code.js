/**
 * Pass State Engine for Eagle Hall Pass
 * Implements core pass creation, updates and closure logic.
 * Spec reference: "Pass State Logic" section lines 239-260.
 */

const PASS_LOG_SHEET = 'Pass Log';
const ACTIVE_PASSES_SHEET = 'Active Passes';
const PERMANENT_RECORD_SHEET = 'Permanent Record';

// Column indexes for each sheet
const ACTIVE_PASSES = {
  PASS_ID: 0,
  STUDENT_ID: 1,
  ORIGIN_STAFF_ID: 2,
  CURRENT_STAFF_ID: 3,
  DESTINATION_ID: 4,
  LEG_ID: 5,
  STATE: 6,
  STATUS: 7,
  START_TIME: 8
};

const PASS_LOG = {
  TIMESTAMP: 0,
  PASS_ID: 1,
  LEG_ID: 2,
  STUDENT_ID: 3,
  STATE: 4,
  STATUS: 5,
  STAFF_ID: 6,
  DESTINATION_ID: 7,
  FLAG: 8,
  NOTES: 9
};

const PERMANENT_RECORD = {
  PASS_ID: 0,
  STUDENT_ID: 1,
  START_TIME: 2,
  END_TIME: 3,
  TOTAL_DURATION: 4,
  ORIGIN_STAFF_ID: 5,
  FINAL_DESTINATION: 6,
  LEG_COUNT: 7,
  FLAGS: 8,
  SUMMARY: 9
};

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

function openPass(studentID, originStaffID, destinationID, notes) {
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][ACTIVE_PASSES.STUDENT_ID] === studentID) {
      throw new Error('Student already has an active pass');
    }
  }

  const passID = generatePassId();
  const now = new Date().toISOString();
  const row = [
    passID,
    studentID,
    originStaffID,
    originStaffID,
    destinationID,
    1,
    'OPEN',
    'OUT',
    now
  ];
  sheet.appendRow(row);

  appendPassLog({
    timestamp: now,
    passID: passID,
    legID: 1,
    studentID: studentID,
    state: 'OPEN',
    status: 'OUT',
    staffID: originStaffID,
    destinationID: destinationID,
    flag: '',
    notes: notes
  });
  return passID;
}

function updatePassStatus(passID, status, locationID, staffID, flag, notes) {
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let row;
  for (let i = 1; i < data.length; i++) {
    if (data[i][ACTIVE_PASSES.PASS_ID] === passID) {
      rowIndex = i + 1;
      row = data[i];
      break;
    }
  }
  if (rowIndex === -1) {
    throw new Error('Pass not found');
  }

  const legID = Number(row[ACTIVE_PASSES.LEG_ID]) + 1;
  const now = new Date().toISOString();

  row[ACTIVE_PASSES.CURRENT_STAFF_ID] = staffID;
  row[ACTIVE_PASSES.DESTINATION_ID] = locationID;
  row[ACTIVE_PASSES.LEG_ID] = legID;
  row[ACTIVE_PASSES.STATUS] = status;
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);

  appendPassLog({
    timestamp: now,
    passID: passID,
    legID: legID,
    studentID: row[ACTIVE_PASSES.STUDENT_ID],
    state: row[ACTIVE_PASSES.STATE],
    status: status,
    staffID: staffID,
    destinationID: locationID,
    flag: flag,
    notes: notes
  });
}

function closePass(passID, closingStaffID, flag, notes) {
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let row;
  for (let i = 1; i < data.length; i++) {
    if (data[i][ACTIVE_PASSES.PASS_ID] === passID) {
      rowIndex = i + 1;
      row = data[i];
      break;
    }
  }
  if (rowIndex === -1) {
    throw new Error('Pass not found');
  }
  const now = new Date().toISOString();
  const legID = Number(row[ACTIVE_PASSES.LEG_ID]) + 1;

  appendPassLog({
    timestamp: now,
    passID: passID,
    legID: legID,
    studentID: row[ACTIVE_PASSES.STUDENT_ID],
    state: 'CLOSED',
    status: 'IN',
    staffID: closingStaffID,
    destinationID: row[ACTIVE_PASSES.DESTINATION_ID],
    flag: flag,
    notes: notes
  });

  const recordSheet = getSheet(PERMANENT_RECORD_SHEET);
  const startTime = row[ACTIVE_PASSES.START_TIME];
  const totalDuration = (new Date(now) - new Date(startTime)) / 60000;
  recordSheet.appendRow([
    passID,
    row[ACTIVE_PASSES.STUDENT_ID],
    startTime,
    now,
    totalDuration,
    row[ACTIVE_PASSES.ORIGIN_STAFF_ID],
    row[ACTIVE_PASSES.DESTINATION_ID],
    legID,
    flag || '',
    notes || ''
  ]);

  sheet.deleteRow(rowIndex);
}
