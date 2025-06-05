function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(null, args); }, delay || 300);
  };
}

function showSpinner(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var spin = document.createElement('span');
  spin.className = 'spinner';
  spin.id = id + '-spinner';
  el.parentNode.insertBefore(spin, el.nextSibling);
}

function hideSpinner(id) {
  var spin = document.getElementById(id + '-spinner');
  if (spin && spin.parentNode) {
    spin.parentNode.removeChild(spin);
  }
}

function showToast(message, type) {
  type = type || 'info';
  var existing = document.querySelector('.toast');
  if (!existing) {
    existing = document.createElement('div');
    existing.className = 'toast';
    document.body.appendChild(existing);
  }
  existing.textContent = message;
  existing.classList.add(type);
  existing.style.opacity = 1;
  setTimeout(function() {
    existing.style.opacity = 0;
  }, 3000);
}
