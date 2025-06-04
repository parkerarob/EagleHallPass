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

  // Active Passes should now contain exactly one row with this passID
  const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === passID);

  const ok1 = assertEquals(ids.student, row[1], 'openPass → studentID stored');
  const ok2 = assertEquals('OPEN',       row[6], 'openPass → state OPEN');
  const ok3 = assertEquals('OUT',        row[7], 'openPass → status OUT');

  // clean-up
  deleteRowsByPassId('Active Passes', passID);
  purgeLogs(passID);
  return ok1 && ok2 && ok3;
}

function test_openPass_duplicateFails() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'dup-guard');
  const ok = assertThrows(() => openPass(ids.student, ids.staffA, 'LIB', ''),
                          'openPass duplicate should throw');
  // clean-up
  deleteRowsByPassId('Active Passes', passID);
  purgeLogs(passID);
  return ok;
}

function test_updatePassStatus_inToLocation() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'update-IN');
  updatePassStatus(passID, 'IN', ids.dest1, ids.staffB, '', '');

  const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
  const row   = sheet.getDataRange().getValues().find(r => r[0] === passID);

  const ok1 = assertEquals(ids.staffB, row[3], 'updatePassStatus → staff updated');
  const ok2 = assertEquals('IN',       row[7], 'updatePassStatus → status IN');

  // clean-up
  deleteRowsByPassId('Active Passes', passID);
  purgeLogs(passID);
  return ok1 && ok2;
}

function test_updatePassStatus_restroomInvalid() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest2, 'restroom-rule');
  const ok = assertThrows(() =>
      updatePassStatus(passID, 'IN', ids.dest2, ids.staffB, '', ''),
      'Restroom pass cannot be IN');
  // clean-up
  deleteRowsByPassId('Active Passes', passID);
  purgeLogs(passID);
  return ok;
}

function test_closePass_removesRow() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'close-test');
  closePass(passID, ids.staffB, '', 'normal close');

  const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
  const exists = sheet.getDataRange().getValues().some(r => r[0] === passID);
  const ok = assertEquals(false, exists, 'closePass removes from Active Passes');

  // clean-up
  purgeLogs(passID);
  return ok;
}

// NOTE: autoClosePasses() relies on bell-schedule helpers.
// Stub getCurrentPeriod()/getNextPeriod() if needed.
function test_autoClosePasses_closes() {
  const ids = _makeTestIds();
  const passID = openPass(ids.student, ids.staffA, ids.dest1, 'auto-close');

  // quick monkey-patch – current period is null, next period not null
  const origGetCurrent = this.getCurrentPeriod;
  const origGetNext    = this.getNextPeriod;
  this.getCurrentPeriod = () => ({ period: '1' });
  this.getNextPeriod    = () => ({ period: '2' });

  autoClosePasses();

  // restore
  this.getCurrentPeriod = origGetCurrent;
  this.getNextPeriod    = origGetNext;

  const sheet = SpreadsheetApp.getActive().getSheetByName('Active Passes');
  const exists = sheet.getDataRange().getValues().some(r => r[0] === passID);
  const ok = assertEquals(false, exists, 'autoClosePasses removes pass');

  purgeLogs(passID);
  return ok;
}

////////////////////  RUNNER  ////////////////////

function runAllTests() {
  const results = [
    test_openPass_createsRow(),
    test_openPass_duplicateFails(),
    test_updatePassStatus_inToLocation(),
    test_updatePassStatus_restroomInvalid(),
    test_closePass_removesRow(),
    test_autoClosePasses_closes()
  ];
  const passed = results.filter(Boolean).length;
  Logger.log('──────────────');
  Logger.log('Test summary: ' + passed + '/' + results.length + ' passed');
  Logger.log('──────────────');
}

