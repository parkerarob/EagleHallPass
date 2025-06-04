/**
 * ──────────────────────────────────────────────────────────────
 *  Eagle Hall Pass • Test Harness (v0.1)
 *  GENERATED: 2025-06-04
 * ─────────────────────────────────────────────────────────
 *  Usage:  runAllTests();
 */

////////////////////  ASSERT HELPERS  ////////////////////

function assertEquals(exp, act, msg) {
  if (exp === act || String(exp) === String(act)) {
    Logger.log('✅ PASS – ' + msg);
    return true;
  }
  Logger.log('❌ FAIL – ' + msg +
             ' | expected: ' + exp + ' | actual: ' + act);
  return false;
}

function assertThrows(fn, msg) {
  try {
    fn();
    Logger.log('❌ FAIL – ' + msg + ' | expected error but none thrown');
    return false;
  } catch (e) {
    Logger.log('✅ PASS – ' + msg + ' | threw: ' + e.message);
    return true;
  }
}

////////////////////  UTILITIES  ////////////////////

function _makeTestIds() {
  const ts = Date.now();
  return {
    student: 'TEST_STU_' + ts,
    staffA:  'TEST_STF_A_' + ts,
    staffB:  'TEST_STF_B_' + ts,
    dest1:   'MEDIA',
    dest2:   'RESTROOM'
  };
}

function deleteRowsByPassId(sheetName, passID) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  for (let r = data.length - 1; r >= 1; r--) {
    if (data[r][0] === passID) {
      sh.deleteRow(r + 1);
    }
  }
}

function purgeLogs(passID) {
  deleteRowsByPassId('Pass Log', passID);
  deleteRowsByPassId('Permanent Record', passID);
}

////////////////////  TESTS  ////////////////////

function test_openPass_createsRow() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'unit-test open');
  try {
    // Active Passes should now contain exactly one row with this passID
    const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
    const data = sheet.getDataRange().getValues();
    const row = data.find(r => r[0] === passID);
    const ok0 = assertEquals(true, !!row, 'openPass → row exists');
    const ok1 = assertEquals(passID,       row[0], 'openPass → passID');
    const ok2 = assertEquals(ids.student,  row[1], 'openPass → studentID');
    const ok3 = assertEquals(ids.staffA,   row[2], 'openPass → originStaffID');
    const ok4 = assertEquals('',           row[3], 'openPass → staffID empty');
    const ok5 = assertEquals(ids.dest1,    row[4], 'openPass → destinationID');
    const ok6 = assertEquals(1,            row[5], 'openPass → legID 1');
    const ok7 = assertEquals('OPEN',       row[6], 'openPass → state OPEN');
    const ok8 = assertEquals('OUT',        row[7], 'openPass → status OUT');
    const ok9 = assertEquals(true,         row[8] > 0,
                             'openPass → startTime positive number');
    return (
      ok0 && ok1 && ok2 && ok3 && ok4 && ok5 && ok6 && ok7 && ok8 && ok9
    );
  } finally {
    deleteRowsByPassId('Active Passes', passID);
    purgeLogs(passID);
  }
}

function test_openPass_duplicateFails() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'dup-guard');
  try {
    const ok = assertThrows(() =>
        openPass(ids.student, ids.staffA, 'LIB', ''),
        'openPass duplicate should throw');
    return ok;
  } finally {
    deleteRowsByPassId('Active Passes', passID);
    purgeLogs(passID);
  }
}

function test_updatePassStatus_inToLocation() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'update-IN');
  try {
    updatePassStatus(passID, 'IN', ids.dest1, ids.staffB, '', '');

    const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
    const row   = sheet.getDataRange().getValues().find(r => r[0] === passID);

    const ok1 = assertEquals(ids.staffB, row[3], 'updatePassStatus → staff updated');
    const ok2 = assertEquals('IN',       row[7], 'updatePassStatus → status IN');
    return ok1 && ok2;
  } finally {
    deleteRowsByPassId('Active Passes', passID);
    purgeLogs(passID);
  }
}

function test_updatePassStatus_restroomInvalid() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest2, 'restroom-rule');
  const passID2 = openPass(ids.student, ids.staffA, ids.dest1, 'media-pass');
  try {
    const ok = assertThrows(() =>
        updatePassStatus(passID, 'IN', ids.dest2, ids.staffB, '', ''),
        'Restroom pass cannot be IN');
    updatePassStatus(passID2, 'IN', ids.dest1, ids.staffB, '', '');
    const row = SpreadsheetApp.getActive()
      .getSheetByName('Active Passes')
      .getDataRange()
      .getValues()
      .find(r => r[0] === passID2);
    const ok2 = assertEquals('IN', row[7], 'Media pass can go IN');
    return ok && ok2;
  } finally {
    deleteRowsByPassId('Active Passes', passID);
    deleteRowsByPassId('Active Passes', passID2);
    purgeLogs(passID);
    purgeLogs(passID2);
  }
}

function test_getCurrentStudentPass_returnsRow() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'getCurrent');
  try {
    const first = getCurrentStudentPass(ids.student);
    const ok1 = assertEquals(true, first !== null, 'getCurrentStudentPass → not null');

    closePass(passID, ids.staffB, '', 'close for test');
    const second = getCurrentStudentPass(ids.student);
    const ok2 = assertEquals(null, second, 'getCurrentStudentPass → null after close');
    return ok1 && ok2;
  } finally {
    purgeLogs(passID);
  }
}

function test_closePass_removesRow() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'close-test');
  try {
    closePass(passID, ids.staffB, '', 'normal close');

    const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
    const exists = sheet.getDataRange().getValues().some(r => r[0] === passID);
    const ok = assertEquals(false, exists, 'closePass removes from Active Passes');
    return ok;
  } finally {
    purgeLogs(passID);
  }
}

// NOTE: autoClosePasses() relies on bell-schedule helpers.
// Stub getCurrentPeriod()/getNextPeriod() if needed.
function test_autoClosePasses_closes() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'auto-close');
  try {
    // quick monkey-patch – current period is null, next period not null
    const origGetCurrent = this.getCurrentPeriod;
    const origGetNext    = this.getNextPeriod;
    try {
      this.getCurrentPeriod = () => ({ period: '1' });
      this.getNextPeriod    = () => ({ period: '2' });

      autoClosePasses();
    } finally {
      this.getCurrentPeriod = origGetCurrent;
      this.getNextPeriod    = origGetNext;
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
    const exists = sheet.getDataRange().getValues().some(r => r[0] === passID);
    const ok = assertEquals(false, exists, 'autoClosePasses removes pass');
    return ok;
  } finally {
    purgeLogs(passID);
  }
}

function test_legId_increments() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'leg-counter');
  try {
    let row = SpreadsheetApp.getActive()
      .getSheetByName('Active Passes')
      .getDataRange()
      .getValues()
      .find(r => r[0] === passID);
    const ok1 = assertEquals(1, row[5], 'openPass → legID starts at 1');
    updatePassStatus(passID, 'IN', ids.dest1, ids.staffA, '', '');
    updatePassStatus(passID, 'OUT', ids.dest1, ids.staffA, '', '');
    row = SpreadsheetApp.getActive()
      .getSheetByName('Active Passes')
      .getDataRange()
      .getValues()
      .find(r => r[0] === passID);
    const ok2 = assertEquals(3, row[5], 'legID increments');
    return ok1 && ok2;
  } finally {
    deleteRowsByPassId('Active Passes', passID);
    purgeLogs(passID);
  }
}

function test_updateClosedPass_throws() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'closed-update');
  try {
    closePass(passID, ids.staffA, '', 'close first');
    const ok = assertThrows(() =>
      updatePassStatus(passID, 'IN', ids.dest1, ids.staffB, '', ''),
      'cannot update closed pass');
    return ok;
  } finally {
    purgeLogs(passID);
  }
}

////////////////////  RUNNER  ////////////////////

function runAllTests() {
  const results = [
    test_openPass_createsRow(),
    test_openPass_duplicateFails(),
    test_updatePassStatus_inToLocation(),
    test_updatePassStatus_restroomInvalid(),
    test_getCurrentStudentPass_returnsRow(),
    test_closePass_removesRow(),
    test_autoClosePasses_closes(),
    test_legId_increments(),
    test_updateClosedPass_throws()
  ];
  const passed = results.filter(Boolean).length;
  Logger.log('──────────────');
  Logger.log('Test summary: ' + passed + '/' + results.length + ' passed');
  Logger.log('──────────────');
}

