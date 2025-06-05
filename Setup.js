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
  const ss = getSpreadsheet();
  const requiredSheets = [
    SHEETS.PASS_LOG,
    SHEETS.ACTIVE_PASSES,
    SHEETS.PERMANENT_RECORD,
    SHEETS.STUDENTS,
    SHEETS.TEACHERS,
    SHEETS.SUPPORT,
    SHEETS.ADMINS,
    SHEETS.SETTINGS,
    SHEETS.BELL_SCHEDULE
  ];

  requiredSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  if (!getSetting('systemTimezone')) {
    const settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
    settingsSheet.appendRow(['systemTimezone', Session.getScriptTimeZone()]);
  }

  installAutoCloseTriggers();
  SpreadsheetApp.getActiveSpreadsheet().toast('System setup complete');
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

function getEmergencyMode() {
  return getSetting('emergencyMode') === 'TRUE';
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

function seedDemoData() {
  const ss = getSpreadsheet();

  const sheetConfigs = [
    {
      name: SHEETS.PASS_LOG,
      headers: [
        'timestamp',
        'passID',
        'legID',
        'studentID',
        'state',
        'status',
        'staffID',
        'destinationID',
        'flag',
        'notes'
      ]
    },
    {
      name: SHEETS.ACTIVE_PASSES,
      headers: [
        'passID',
        'studentID',
        'originStaffID',
        'currentStaffID',
        'destinationID',
        'legID',
        'state',
        'status',
        'startTime'
      ]
    },
    {
      name: SHEETS.PERMANENT_RECORD,
      headers: [
        'passID',
        'studentID',
        'startTime',
        'endTime',
        'totalDuration',
        'originStaffID',
        'destinationID',
        'legID',
        'flag',
        'notes'
      ]
    },
    {
      name: SHEETS.STUDENTS,
      headers: [
        'studentID',
        'studentEmail',
        'firstName',
        'lastName',
        'p1A',
        'p2A',
        'p3A',
        'p4A'
      ],
      rowTemplate: (i) => [
        `S00${i}`,
        `student${i}@school.edu`,
        `Student${i}`,
        `Last${i}`,
        'T001',
        'T002',
        'T003',
        'T004'
      ]
    },
    {
      name: SHEETS.TEACHERS,
      headers: [
        'staffID',
        'staffEmail',
        'firstName',
        'lastName',
        'primaryRoom',
        'periodOverride'
      ],
      rowTemplate: (i) => [
        `T00${i}`,
        `teacher${i}@school.edu`,
        `Teacher${i}`,
        `Last${i}`,
        `Room${i}`,
        'FALSE'
      ]
    },
    {
      name: SHEETS.SUPPORT,
      headers: [
        'staffID',
        'staffEmail',
        'firstName',
        'lastName',
        'primaryRoom',
        'periodOverride'
      ],
      rowTemplate: (i) => [
        `SUP0${i}`,
        `support${i}@school.edu`,
        `Support${i}`,
        `Last${i}`,
        `RoomS${i}`,
        'TRUE'
      ]
    },
    {
      name: SHEETS.ADMINS,
      headers: ['staffID', 'staffEmail', 'firstName', 'lastName'],
      rowTemplate: (i) => [
        `ADM0${i}`,
        `admin${i}@school.edu`,
        `Admin${i}`,
        `Last${i}`
      ]
    },
    {
      name: SHEETS.SETTINGS,
      headers: ['settingKey', 'settingValue', 'description'],
      rows: [
        ['systemTimezone', Session.getScriptTimeZone(), 'Timezone'],
        ['emergencyMode', 'FALSE', 'Emergency mode toggle'],
        ['devMode', 'FALSE', 'Developer mode toggle'],
        ['devUserEmail', '', 'Dev override email'],
        ['longDurationThreshold', '10', 'Minutes for LD flag'],
        ['dayType', 'A', 'Day type (A/B)']
      ]
    },
    {
      name: SHEETS.BELL_SCHEDULE,
      headers: ['period', 'startTime', 'endTime', 'dayType'],
      rows: [
        ['p1A', '08:00', '08:50', 'A'],
        ['p2A', '09:00', '09:50', 'A'],
        ['p3A', '10:00', '10:50', 'A'],
        ['p4A', '11:00', '11:50', 'A'],
        ['LunchA', '12:00', '12:30', 'A']
      ]
    }
  ];

  sheetConfigs.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    } else {
      sheet.clear();
    }

    sheet.appendRow(cfg.headers);

    if (cfg.rows) {
      cfg.rows.forEach(r => sheet.appendRow(r));
    } else if (cfg.rowTemplate) {
      for (let i = 1; i <= 5; i++) {
        sheet.appendRow(cfg.rowTemplate(i));
      }
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast('Demo data seeded!');
}
