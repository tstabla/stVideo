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
			'mp4'   : 'filename.mp4', //recommended
			'webm'  : 'filename.webm', //recommended
			'ogg'   : 'filename.ogg',
			'width' : 524,  //required
			'height': 270   //required
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
