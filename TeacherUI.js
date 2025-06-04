// Teacher interface generation
function renderTeacherDashboard(teacher) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  if (role !== 'teacher') {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('teacher');
  template.teacher = teacher;
  template.csrfToken = getOrCreateCsrfToken();
  return template.evaluate().setTitle('Eagle Hall Pass - Teacher');
}
