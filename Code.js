/**
 * Pass State Engine for Eagle Hall Pass
 * Implements core pass creation, updates and closure logic.
 * Spec reference: "Pass State Logic" section lines 239-260.
 */

const PASS_LOG_SHEET = 'Pass Log';
const ACTIVE_PASSES_SHEET = 'Active Passes';
const PERMANENT_RECORD_SHEET = 'Permanent Record';

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
  // Prevent pass changes if emergency mode is enabled
  if (getSetting('emergencyMode') === 'TRUE') {
    throw new Error('System is in emergency mode. Passes cannot be modified');
  }
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === studentID) {
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
  // Prevent pass changes if emergency mode is enabled
  if (getSetting('emergencyMode') === 'TRUE') {
    throw new Error('System is in emergency mode. Passes cannot be modified');
  }
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
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
    throw new Error('Pass not found');
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
    return;
  }

  const legID = Number(row[5]) + 1;
  const now = new Date().toISOString();

  row[3] = staffID;
  row[4] = locationID;
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
    destinationID: locationID,
    flag: flag,
    notes: notes
  });
}

function closePass(passID, closingStaffID, flag, notes) {
  // Prevent pass changes if emergency mode is enabled
  if (getSetting('emergencyMode') === 'TRUE') {
    throw new Error('System is in emergency mode. Passes cannot be modified');
  }
  const sheet = getSheet(ACTIVE_PASSES_SHEET);
  const data = sheet.getDataRange().getValues();
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
    throw new Error('Pass not found');
  }
  const now = new Date().toISOString();
  const legID = Number(row[5]) + 1;

  appendPassLog({
    timestamp: now,
    passID: passID,
    legID: legID,
    studentID: row[1],
    state: 'CLOSED',
    status: 'IN',
    staffID: closingStaffID,
    destinationID: row[4],
    flag: flag,
    notes: notes
  });

  const recordSheet = getSheet(PERMANENT_RECORD_SHEET);
  const startTime = row[8];
  const totalDuration = (new Date(now) - new Date(startTime)) / 60000;
  recordSheet.appendRow([
    passID,
    row[1],
    startTime,
    now,
    totalDuration,
    row[2],
    row[4],
    legID,
    flag || '',
    notes || ''
  ]);

  sheet.deleteRow(rowIndex);
}
