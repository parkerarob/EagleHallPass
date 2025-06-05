// Student interface generation
function renderStudentDashboard(student) {
  const role = getEffectiveUser(getCurrentUserEmail()).role;
  
  // TODO: REMOVE THIS DEV OVERRIDE BEFORE PRODUCTION
  const isDevOverride = (getCurrentUserEmail() === 'dev@example.com');
  
  if (role !== 'student' && !isDevOverride) {
    return HtmlService.createHtmlOutput('Access denied');
  }
  const template = HtmlService.createTemplateFromFile('student');
  template.student = student;
  template.csrfToken = getOrCreateCsrfToken();
  return template.evaluate().setTitle('Eagle Hall Pass - Student');
}
