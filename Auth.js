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
  if (devMode === 'TRUE') {
    const override = getSetting('devUserEmail');
    if (override) {
      email = override;
    }
  }
  return getUserRecord(email);
}
