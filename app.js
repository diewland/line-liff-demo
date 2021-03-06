// gen menu
let menus = [
  [ 'Home', 'index.html' ],
  [ 'Face', 'face.html' ],
];
$('.menu').html(menus.map((m) => `<a href='${m[1]}'>${m[0]}</a>`).join(' | '));

// prevent link cache
$('a').each((i, o) => {
  o.href += '?t=' + (+ new Date());
});

// show useragent
$('.uagent').html(navigator.userAgent);

// play localStorage
// TODO may be remove in the future
let view = +localStorage.getItem('view');
localStorage.setItem('view', ++view);
$('.view').html(view);
