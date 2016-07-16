// Regex-pattern to check URLs against.
var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?youtube\.com/;

var token = null;

//Authorize
chrome.identity.getAuthToken({
    interactive: true
}, function(tkn) {
    if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
    }
    console.log("got token");

    token = tkn;
});

function makePlaylist(title, desc, videoIDs) {
    if (!token) {
        console.log("No access token");
        return;
    }

    $.ajax({
        "url": "https://www.googleapis.com/youtube/v3/playlists?alt=json&part=snippet&access_token=" + token,
        "method": "POST",
        "contentType": "application/json",
        "data": JSON.stringify({
            "snippet": {
                "title": title,
                "description": desc,
                "privacyStatus": "private"
            }
        }),
        success: function(data, textStatus, jqXHR) {
            console.log("success", videoIDs);
            insertVideos(data.id, videoIDs);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown, jqXHR.responseText);
        }
    });
}

function insertVideos(playlistID, videoIDs, firstVideoID) {
    if (videoIDs.length === 0) {
        return;
    }

    var videoID = videoIDs.pop();

    console.log("inserting: " + videoID);
    $.ajax({
        "url": "https://www.googleapis.com/youtube/v3/playlistItems?alt=json&part=snippet&access_token=" + token,
        "method": "POST",
        "contentType": "application/json",
        "data": JSON.stringify({
            "snippet": {
                "playlistId": playlistID,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": videoID
                }
            }
        }),
        success: function(data, textStatus, jqXHR) {
            if (videoIDs.length === 0) { //FIXME
                console.log("done inserting");
                playlistCreatedHandler(playlistID, firstVideoID);
            } else {
                console.log(videoIDs.length + " remaining");
                insertVideos(playlistID, videoIDs, firstVideoID ? firstVideoID : videoID);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown, jqXHR.responseText);
        }
    });
}

function playlistCreatedHandler(playlistID, firstVideoID) {
    chrome.tabs.executeScript(null, {
        code:"alert('Playlist Created Successfully');"
    }, function (resp) {
        if (resp) {
            chrome.tabs.create({ url: "https://www.youtube.com/watch?v=" + firstVideoID + "&list=" + playlistID });
        }
        console.log(resp, "done");
    });


}

// When the button is clicked...
chrome.browserAction.onClicked.addListener(function (tab) {
    console.log("starting");
    // ensure we are on a valid Youtube page
    if (urlRegex.test(tab.url)) {
        // execute content script to find unwatched videos, injecting jquery
        chrome.tabs.executeScript(null, { file: "jquery-3.0.0.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "content.js" }, processUnwatched);
        });
    }
});

function processUnwatched(unwatched) {
    if (unwatched.length)
        unwatched = unwatched[0];
    else {
        console.log("Nothing returned");
        return;
    }

    if (!unwatched.length) {
        console.log("Nothing unwatched");
        return;
    }

    console.log("creating playlist");
    makePlaylist("Youtube Catchup", "Temporary playlist created by youtube catchup", unwatched);
}