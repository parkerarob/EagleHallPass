// Student interface generation
function renderStudentDashboard(student) {
  const template = HtmlService.createTemplateFromFile('student');
  template.student = student;
  return template.evaluate().setTitle('Eagle Hall Pass - Student');
}
