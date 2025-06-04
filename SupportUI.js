// Support staff interface generation
function renderSupportDashboard(support) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  if (role !== 'support') {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('support');
  template.support = support;
  return template.evaluate().setTitle('Eagle Hall Pass - Support');
}
