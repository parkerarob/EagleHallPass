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

function doPost(e) {
  // Placeholder for POST actions
  return doGet(e);
}
