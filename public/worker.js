var cacheName = 'TeamToDo';
var filesToCache = [
  'favicon.ico'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache).catch(function (error) {
        console.info('Could not download to cache!' + error);
      });
    })
  );
});

this.addEventListener('fetch', function (event) {
  //  console.info(event.request)
  event.respondWith(
    caches.match(event.request).then(function (resp) {
      return resp || fetch(event.request).then(function (response) {
        return caches.open(cacheName).then(function (cache) {
          //add to cache
/*
          cache.put(event.request, response.clone()).catch(function (error) {
            console.info('Could not add to cache!' + error);
          });
*/
          return response;
        }).catch(function (error) {
          console.info('Could not open cache!' + error);
        });
      }).catch(function (error) {
        console.info('Resource not found!' + error);
      });
    }).catch(function (error) {
      console.info('Resource not found in the cache!' + error);
    }));
});
