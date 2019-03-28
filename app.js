// prevent link cache
$('a').each((idx, o) => {
  o.href += '?t=' + (+ new Date());
});

// show useragent
$('.uagent').html(navigator.userAgent);
