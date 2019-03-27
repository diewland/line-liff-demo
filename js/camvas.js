/*
Copyright (c) 2012 Claudio Brandolino

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


// requestAnimationFrame implementation, we just ignore it.
// My policy for experimental software is: if you don't have a
// nightly build, you don't deserve exceptions.
window.URL = window.URL || window.webkitURL

navigator.getUserMedia  = navigator.getUserMedia || 
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia
                          
window.requestAnimationFrame = window.requestAnimationFrame ||
                               window.webkitRequestAnimationFrame ||
                               window.mozRequestAnimationFrame ||
                               window.msRequestAnimationFrame ||
                               window.oRequestAnimationFrame

// Integrate navigator.getUserMedia & navigator.mediaDevices.getUserMedia
function getUserMedia (constraints, successCallback, errorCallback) {
  if (!constraints || !successCallback || !errorCallback) {return}
  
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia(constraints).then(successCallback, errorCallback)
  } else {
    navigator.getUserMedia(constraints, successCallback, errorCallback)
  }
}
                               
// The function takes a canvas context and a `drawFunc` function.
// `drawFunc` receives two parameters, the video and the time since
// the last time it was called.
function camvas(ctx, drawFunc, options) {
  var self = this
  this.ctx = ctx
  this.draw = drawFunc || function(video, dt, thiz){ thiz.draw_img(ctx); };
  this.profiles = {
    qvga: { video: {width: {exact: 320}, height: {exact: 240}} },
    vga:  { video: {width: {exact: 640}, height: {exact: 480}} },
    hd:   { video: {width: {exact: 1280}, height: {exact: 720}} },
    fullhd: { video: {width: {exact: 1920}, height: {exact: 1080}} },
    '4k': { video: {width: {exact: 4096}, height: {exact: 2160}} },
    '8k': { video: {width: {exact: 7680}, height: {exact: 4320}} },
  }; // copy from https://webrtc.github.io/samples/src/content/getusermedia/resolution/

  var options = options || {};
  var mode = options.mode || 'vga';
  this.profile = this.profiles[mode];
  var mode_resize = options.mode_resize === undefined ? true : options.mode_resize;

  // default is resize canvas based on profile config
  // else trust width/height on canvas dom
  if(mode_resize){
    this.ctx.canvas.width = this.profile.video.width.exact;
    this.ctx.canvas.height =  this.profile.video.height.exact;
  }

  // We can't `new Video()` yet, so we'll resort to the vintage
  // "hidden div" hack for dynamic loading.
  var streamContainer = document.createElement('div')
  this.video = document.createElement('video')

  // If we don't do this, the stream will not be played.
  // By the way, the play and pause controls work as usual 
  // for streamed videos.
  this.video.setAttribute('autoplay', '1')

  // set video size from profile
  this.video.setAttribute('width', this.profile.video.width.exact)
  this.video.setAttribute('height', this.profile.video.height.exact)

  this.video.setAttribute('style', 'display:none')
  streamContainer.appendChild(this.video)
  document.body.appendChild(streamContainer)

  // The callback happens when we are starting to stream the video.
  getUserMedia(this.profile, function(stream) {
    // Yay, now our webcam input is treated as a normal video and
    // we can start having fun
    self.stream = stream;
    try {
      self.video.srcObject = stream;
    } catch (error) {
      self.video.src = URL.createObjectURL(stream);
    }
    // Let's start drawing the canvas!
    self.update()
  }, function(err){
    alert(err.message);
    //alert(`Your camera not support [${mode}]`);
    //throw err
  })

  // As soon as we can draw a new frame on the canvas, we call the `draw` function 
  // we passed as a parameter.
  this.update = function() {
    var self = this
    var last = Date.now()
    var loop = function() {
      // For some effects, you might want to know how much time is passed
      // since the last frame; that's why we pass along a Delta time `dt`
      // variable (expressed in milliseconds)
      var dt = Date.now() - last
      self.draw(self.video, dt, self)
      last = Date.now()
      requestAnimationFrame(loop) 
    }
    requestAnimationFrame(loop) 
  } 

  // drawImage tools
  this.draw_img = function(ctx){
    ctx.drawImage(self.video, 0, 0);
  };
  this.draw_img_stretch = function(ctx){
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    ctx.drawImage(self.video, 0, 0, w, h);
  };
  this.draw_img_crop1 = function(ctx, x, y){
    // just move full video to minus x, y
    x = x || ctx.canvas.width - self.video.videoWidth;
    y = y || ctx.canvas.height - self.video.videoHeight;
    ctx.drawImage( self.video, x, y);
  };
  this.draw_img_crop2 = function(ctx, sx, sy){
    // crop video to canvas size first and render on 0, 0
    var sx = sx || self.video.videoWidth - ctx.canvas.width;
    var sy = sy || self.video.videoHeight - ctx.canvas.height;
    ctx.drawImage(
      self.video,
      sx,
      sy,
      ctx.canvas.width,
      ctx.canvas.height,
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
  };

  // close camvas
  this.close = function(){
    // stop stream
    if(this.stream){
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    // clear video
    this.video.pause();
    this.video.src='';
    this.video.parentNode.removeChild(this.video);
  }
}

