playlistID = /&list=[^&]{34}/.exec(window.location.href)[0].substring(6);

var lookup = {};
lookup[playlistID] = null;
chrome.storage.local.get(lookup, callback);

chrome.runtime.sendMessage(chrome.runtime.id, { action: "load", playlistID: playlistID });

function callback(res) {
    console.log(res);
    if (res[playlistID] == null) {
        console.log("playlist not created by us");
    } else {
        console.log("playlist found");
        chrome.storage.local.set(res, function() {
            updatePlaylist(res[playlistID].videos);
            chrome.storage.onChanged.addListener(updatePlaylist);
        });
    }
}
var index = 26;

function updatePlaylist(changes, areaName) {
    if (!(areaName == "local" && changes[playlistID])) {
        console.log("No changes to make");
        return;
    }

    console.log("updating...");
    var videos = changes[playlistID].newValue.videos;

    var lastIdx = parseInt($("#playlist-autoscroll-list > li:last").attr("data-index"));
    console.log("lastIdx", lastIdx);
    console.log("videos.length", videos.length);

    while (videos.length - 1 > lastIdx) {
        var video = videos[lastIdx+1];
        console.log(videos);
        console.log(video);
        var html = `<li class="yt-uix-scroller-scroll-unit" data-video-title="` + video.title + `" data-video-id="` + video.id + `" data-video-username="` + video.username + `" data-index="` + video.index + `">
<span class="index">
    ` + video.index + `
</span>
  <a href="/watch?v=` + video.id + `&amp;list=` + playlistID + `&amp;index=` + video.index + `" class="yt-uix-sessionlink  spf-link  playlist-video clearfix        spf-link ">
  <button class="yt-uix-button yt-uix-button-size-default yt-uix-button-player-controls yt-uix-button-empty yt-uix-button-has-icon yt-uix-button-playlist-remove-item yt-uix-button-opacity spf-nolink yt-uix-tooltip" type="button" onclick=";return false;" aria-label="Remove from playlist" title="Remove from playlist"><span class="yt-uix-button-icon-wrapper"><span class="yt-uix-button-icon yt-uix-button-icon-playlist-remove-item yt-sprite"></span></span></button>
  <span class="video-thumb  yt-thumb yt-thumb-72">
<span class="yt-thumb-default">
  <span class="yt-thumb-clip">
      <img width="72" aria-hidden="true" src="https://i.ytimg.com/vi/` + video.id + `/default.jpg" alt="">
    <span class="vertical-align"></span>
  </span>
</span>
</span>

<div class="playlist-video-description">
  <h4 class="yt-ui-ellipsis yt-ui-ellipsis-2">
      ` + video.title + `
  </h4>
    <span class="video-uploader-byline">
      <span class="" ` + //data-ytid removed
      `>` + video.username + `</span>
    </span>
</div>
</a>

</li>`
        $(html).appendTo('#playlist-autoscroll-list');
        lastIdx++;
    }
}