function testAuth() {
  const testEmails = [
    'robert.parker@nhcs.net',
    'student1@school.edu',
    'teacher1@school.edu',
    'support1@school.edu',
    'admin1@school.edu',
    'randomuser@fake.com'
  ];

  testEmails.forEach(email => {
    const user = getEffectiveUser(email);
    if (user) {
      Logger.log(`\u2705 ${email} \u2192 Role: ${user.role}`);
    } else {
      Logger.log(`\u274c ${email} \u2192 NOT FOUND`);
    }
  });
}
