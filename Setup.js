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
