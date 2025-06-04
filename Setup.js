// Administrative and system management functions

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Eagle Hall Pass')
    .addItem('Setup System', 'setupSystem')
    .addSeparator()
    .addItem('Toggle Developer Mode', 'toggleDevMode')
    .addItem('Emergency Mode', 'toggleEmergencyMode')
    .addToUi();
}

function setupSystem() {
  SpreadsheetApp.getActiveSpreadsheet().toast('Setup placeholder');
  installAutoCloseTriggers();
}

function toggleDevMode() {
  const current = getSetting('devMode') === 'TRUE';
  const newVal = current ? 'FALSE' : 'TRUE';
  const ss = getSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const data = settings.getDataRange().getValues();
  const row = data.findIndex(r => r[0] === 'devMode') + 1;
  if (row > 0) {
    settings.getRange(row, 2).setValue(newVal);
  }
  PropertiesService.getScriptProperties().deleteProperty(CACHE_KEY_PREFIX + SHEETS.SETTINGS);
  SpreadsheetApp.getActiveSpreadsheet().toast('Developer mode: ' + newVal);
}

function toggleEmergencyMode() {
  const current = getSetting('emergencyMode') === 'TRUE';
  const newVal = current ? 'FALSE' : 'TRUE';
  const ss = getSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const data = settings.getDataRange().getValues();
  const row = data.findIndex(r => r[0] === 'emergencyMode') + 1;
  if (row > 0) {
    settings.getRange(row, 2).setValue(newVal);
  }
  PropertiesService.getScriptProperties().deleteProperty(CACHE_KEY_PREFIX + SHEETS.SETTINGS);
  SpreadsheetApp.getActiveSpreadsheet().toast('Emergency mode: ' + newVal);
}

function installAutoCloseTriggers() {
  const tz = getSetting('systemTimezone') || Session.getScriptTimeZone();
  const dayType = getSetting('dayType');
  const schedule = getBellSchedule().filter(p => !dayType || p.dayType === dayType);

  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'autoClosePasses') {
      ScriptApp.deleteTrigger(t);
    }
  });

  const today = new Date();
  schedule.forEach(p => {
    const [h, m] = String(p.endTime).split(':').map(Number);
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
    ScriptApp.newTrigger('autoClosePasses').timeBased().at(d).create();
  });
}
