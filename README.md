# jackbox-player

Split-view browser tab that shows a stream on the left and [jackbox.tv](https://jackbox.tv) on the right — so players at Discord game nights can watch the host and submit inputs from a single phone screen.

**Live:** [jackbox-player.6static.com](https://jackbox-player.6static.com)

## Usage

```
https://jackbox-player.6static.com/?code=ABCD&stream=https://twitch.tv/channel
```

| Param | Purpose |
|---|---|
| `code` | Room code — displayed in the bottom bar with a copy button |
| `stream` | Stream URL — auto-detected, or paste it into the input bar |

Supported stream types: YouTube, Twitch, HLS / Owncast (`.m3u8`), direct video (`.mp4`, `.webm`, `.ogg`).

## No build step

Plain HTML + CSS + vanilla JS. Open `index.html` directly in a browser.
