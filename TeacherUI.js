// Teacher interface generation
function renderTeacherDashboard(teacher) {
  const template = HtmlService.createTemplateFromFile('teacher');
  template.teacher = teacher;
  return template.evaluate().setTitle('Eagle Hall Pass - Teacher');
}
