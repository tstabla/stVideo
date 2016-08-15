#stVideo
HTML5 video canvas player. Prevents video fullscreen on iPhone/iPad.

[SEE DEMO](https://tstabla.github.io/stVideo/)

##How to use
```html
<div id="player" data-stvideo="{'mp4': 'assets/video/filename.mp4', 'webm': 'assets/video/filename.webm', 'width': 524, 'height': 270}"></div>
```

```javascript
var video = new stVideo('#player');

video.on('canplaythrough', function() {
	video.play();
});
```
