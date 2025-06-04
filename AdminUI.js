// Admin interface generation
function renderAdminDashboard(admin) {
  const template = HtmlService.createTemplateFromFile('admin');
  template.admin = admin;
  return template.evaluate().setTitle('Eagle Hall Pass - Admin');
}
