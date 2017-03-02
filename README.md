#[stVideo](https://tstabla.github.io/stVideo/)
HTML5 video canvas player. Prevents video fullscreen on iPhone/iPad.

[SEE DEMO](https://tstabla.github.io/stVideo/)

##How to use

Just create div where canvas or video element will be inserted.
Optionally you can add attribute with params.

```html
<div id="player" data-stvideo="{'mp4': 'filename.mp4', 'webm': 'filename.webm', 'width': 524, 'height': 270}"></div>
```

Then create new object.

```javascript
var video = new stVideo('#player');
```

Or create new object with params, if you not added them to HTML element.

```javascript
var video = new stVideo('#player', {
  "mp4"   : "filename.mp4",  //recommended
  "webm"  : "filename.webm",  //recommended
  "ogg"   : "filename.ogg",
  "width" : 524,  //required
  "height": 270,  //required
  "force" : "",  //'video' or 'canvas',
  "framesPerSecond": 30,  //needed for canvas refresh, default 30
  "volume": 1  //default
});
```

Look at the table below, and best use .mp4 and .webm video files format.

| &nbsp; | .mp4 | .webm | .ogg |
| --- | :---: | :---: | :---: |
| Android | X | &nbsp; | X |
| iPhone | X | &nbsp; | &nbsp; |
| Firefox | &nbsp; | X | X |
| Chrome | &nbsp; | X | X |
| Safari | X | &nbsp; | &nbsp; |
| IE >= 9 | X | &nbsp; | &nbsp; |
| IE Mobile | X | &nbsp; | &nbsp; |


At the end, you can play video immediately after initialization.  

```javascript
video.on('canplaythrough', function() {
	video.play();
});
```

You can attach other events from list http://www.w3.org/TR/html5/embedded-content-0.html#mediaevents but some of them may not work properly with canvas video for ex. "volumechange".

Examples:

```javascript
video.on('play', function() {
    console.log('play');
});

video.on('pause', function() {
    console.log('pause');
});

video.on('end', function() {
    console.log('end');
});
```

##Events

```javascript
video.play(); //play video

video.pause(); //pause video

video.on('name', function(){}); //for attach event

video.destroy(); //not working - future function for remove player
```
