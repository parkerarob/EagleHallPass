// Support staff interface generation
function renderSupportDashboard(support) {
  const template = HtmlService.createTemplateFromFile('support');
  template.support = support;
  return template.evaluate().setTitle('Eagle Hall Pass - Support');
}
