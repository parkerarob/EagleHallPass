// Main entry points and routing for the web app

function doGet(e) {
  const email = getCurrentUserEmail();
  const user = getEffectiveUser(email);
  if (!user) {
    return HtmlService.createHtmlOutput('Access denied: user not found');
  }
  switch (user.role) {
    case 'student':
      return renderStudentDashboard(user.record);
    case 'teacher':
      return renderTeacherDashboard(user.record);
    case 'support':
      return renderSupportDashboard(user.record);
    case 'admin':
      return renderAdminDashboard(user.record);
    default:
      return HtmlService.createHtmlOutput('Unknown role');
  }
}

function doPost(e) {
  const email = getCurrentUserEmail();
  const user = getEffectiveUser(email);
  if (!user || !e.postData) {
    return HtmlService.createHtmlOutput('Invalid request');
  }
  const data = JSON.parse(e.postData.contents || '{}');
  const action = data.action;
  const token = data.csrfToken;
  if (token !== getOrCreateCsrfToken()) {
    return ContentService.createTextOutput('ERROR: Invalid CSRF token');
  }

  try {
    switch (action) {
      case 'openPass':
        if (user.role !== 'teacher' && user.role !== 'support') {
          throw new Error('Unauthorized');
        }
        openPass(data.studentID, user.record.staffID, data.destinationID, data.notes);
        break;
      case 'updatePassStatus':
        updatePassStatus(data.passID, data.status, data.locationID, user.record.staffID, data.flag, data.notes);
        break;
      case 'closePass':
        closePass(data.passID, user.record.staffID, data.flag, data.notes);
        break;
      case 'requestPass':
        if (user.role !== 'student') {
          throw new Error('Unauthorized - Students only');
        }
        const newPass = requestPass(data.studentID, data.destination, token);
        return ContentService.createTextOutput(JSON.stringify(newPass));
      case 'closePassStudent':
        if (user.role !== 'student') {
          throw new Error('Unauthorized - Students only');
        }
        closePassStudent(data.passID, token);
        break;
      default:
        throw new Error('Unknown action');
    }
    return ContentService.createTextOutput('OK');
  } catch (err) {
    Logger.log(err.stack || err.message);
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}

// Expose functions for google.script.run calls from student UI
function getStudentPassStatus(studentID) {
  const token = getOrCreateCsrfToken();
  return getCurrentStudentPass(studentID, token);
}

function createStudentPass(studentID, destination) {
  const token = getOrCreateCsrfToken();
  return requestPass(studentID, destination, token);
}

function closeStudentPass(passID) {
  const token = getOrCreateCsrfToken();
  return closePassStudent(passID, token);
}