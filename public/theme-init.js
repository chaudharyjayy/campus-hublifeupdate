/* Theme init: restore saved/system theme before first paint. */
try {
  var saved = localStorage.getItem('campushub:theme');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light');
} catch {
  document.documentElement.dataset.theme = 'light';
}
