// Authentication and role resolution helpers
// Uses Google OAuth via Apps Script to identify user email
// and determines user role based on data sheets.

function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

function getUserRecord(email) {
  let user = getStudentByEmail(email);
  if (user) return { role: 'student', record: user };
  user = getTeacherByEmail(email);
  if (user) return { role: 'teacher', record: user };
  user = getSupportByEmail(email);
  if (user) return { role: 'support', record: user };
  user = getAdminByEmail(email);
  if (user) return { role: 'admin', record: user };
  return null;
}

function getEffectiveUser(email) {
  const devMode = getSetting('devMode');
  let originalEmail = email;

  if (devMode === 'TRUE') {
    const override = getSetting('devUserEmail');
    if (override && override.trim() !== '') {
      email = override;
      Logger.log('DevMode ON \u2014 Using override email: ' + email);
    } else {
      Logger.log('DevMode ON \u2014 WARNING: devUserEmail is blank. Using actual user email.');
    }
  }

  const userRecord = getUserRecord(email);

  if (!userRecord) {
    Logger.log('AUTH FAIL \u2014 Email not found in any sheet: ' + email + ' (original: ' + originalEmail + ')');
    return null;
  }

  Logger.log('AUTH SUCCESS \u2014 Email: ' + email + ', Role: ' + userRecord.role);

  return userRecord;
}

function getOrCreateCsrfToken() {
  const props = PropertiesService.getUserProperties();
  let token = props.getProperty('csrfToken');
  if (!token) {
    token = Utilities.getUuid();
    props.setProperty('csrfToken', token);
  }
  return token;
}

function whoAmI() {
  const email = getCurrentUserEmail();
  const user = getEffectiveUser(email);
  let role = user ? user.role : 'NOT FOUND';
  let source = 'None';

  if (user && user.record) {
    if (getStudentByEmail(email)) source = 'Student Data';
    else if (getTeacherByEmail(email)) source = 'Teacher Data';
    else if (getSupportByEmail(email)) source = 'Support Data';
    else if (getAdminByEmail(email)) source = 'Admin Data';
  }

  return {
    email: email,
    role: role,
    source: source
  };
}
