// Restores deep-link paths redirected by public/404.html on GitHub Pages.
;(function () {
  const locationRef = window.location
  if (locationRef.search[1] !== '/') return
  const decoded = locationRef.search
    .slice(1)
    .split('&')
    .map((segment) => segment.replace(/~and~/g, '&'))
    .join('?')
  window.history.replaceState(null, '', decoded + locationRef.hash)
})()
