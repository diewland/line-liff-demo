// gen menu
let menus = [
  [ 'Home', 'index.html' ],
  [ 'Face', 'face.html' ],
];
// $('.menu').html(menus.map((m) => `<a href='${m[1]}'>${m[0]}</a>`).join(' | '));
let menu_html = menus.map(function(m){
  return `<a href='${m[1]}'>${m[0]}</a>`;
}).join(' | ');
$('.menu').html(menu_html);

// prevent link cache
$('a').each((i, o) => {
  o.href += '?t=' + (+ new Date());
});

// show useragent
$('.uagent').html(navigator.userAgent);
