// Support staff interface generation
function renderSupportDashboard(support) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  if (role !== 'support') {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('support');
  template.support = support;
  template.csrfToken = getOrCreateCsrfToken();
  return template.evaluate().setTitle('Eagle Hall Pass - Support');
}

function listActivePasses() {
  return getAllActivePasses();
}

function supportAction(data) {
  const res = doPost({ postData: { contents: JSON.stringify(data) } });
  return res.getContent();
}
