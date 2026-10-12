/* Keep production images visible while same-origin media is loading. */
(function () {
  'use strict';

  function prepare(img) {
    if (!img || img.tagName !== 'IMG' || img.dataset.dynamicPreloadReady === '1') return;
    img.dataset.dynamicPreloadReady = '1';
    img.loading = img.loading || 'eager';
    img.decoding = img.decoding || 'async';
  }

  document.querySelectorAll('img').forEach(prepare);

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('img')) prepare(node);
        if (node.querySelectorAll) node.querySelectorAll('img').forEach(prepare);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
