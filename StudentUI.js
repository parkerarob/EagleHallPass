// Student interface generation
function renderStudentDashboard(student) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  if (role !== 'student') {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('student');
  template.student = student;
  return template.evaluate().setTitle('Eagle Hall Pass - Student');
}
