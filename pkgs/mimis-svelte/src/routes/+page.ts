if(typeof(navigator) !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {(
    navigator.serviceWorker.register('/service-worker.js')
    .then((registration: ServiceWorkerRegistration) => {
      console.log('Service Worker registered successfully:', registration.scope);
    })
    .catch((error: Error) => {
      console.error('Service Worker registration failed:', error);
    })
  )})
}