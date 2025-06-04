// Admin interface generation
function renderAdminDashboard(admin) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  if (role !== 'admin') {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('admin');
  template.admin = admin;
  template.csrfToken = getOrCreateCsrfToken();
  return template.evaluate().setTitle('Eagle Hall Pass - Admin');
}
