// Clear dark mode class on load
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  localStorage.removeItem('theme');
}
