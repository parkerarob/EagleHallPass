// Main entry points and routing for the web app

function doGet(e) {
  const email = getCurrentUserEmail();
  const user = getEffectiveUser(email);
  if (!user) {
    return HtmlService.createHtmlOutput('Access denied: user not found');
  }
  switch (user.role) {
    case 'student':
      return renderStudentDashboard(user.record);
    case 'teacher':
      return renderTeacherDashboard(user.record);
    case 'support':
      return renderSupportDashboard(user.record);
    case 'admin':
      return renderAdminDashboard(user.record);
    default:
      return HtmlService.createHtmlOutput('Unknown role');
  }
}

function verifyXsrfToken(token) {
  const stored = PropertiesService.getScriptProperties().getProperty('XSRF_TOKEN');
  return token && token === stored;
}

function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (!verifyXsrfToken(params.token)) {
    return HtmlService.createHtmlOutput('Invalid or missing token');
  }

  switch (params.action) {
    case 'openPass':
      const passId = openPass(params.studentID, params.originStaffID, params.destinationID, params.notes);
      return ContentService.createTextOutput(passId);
    case 'updatePass':
      updatePassStatus(params.passID, params.status, params.locationID, params.staffID, params.flag, params.notes);
      return ContentService.createTextOutput('OK');
    case 'closePass':
      closePass(params.passID, params.closingStaffID, params.flag, params.notes);
      return ContentService.createTextOutput('OK');
    default:
      return HtmlService.createHtmlOutput('Unknown action');
  }
}
