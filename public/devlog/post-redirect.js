// Legacy URL shim for /devlog/post.html?slug=X (see post.html).
var slug = new URLSearchParams(location.search).get('slug');
location.replace(slug ? '/devlog/' + encodeURIComponent(slug) + '/' : '/devlog/');
