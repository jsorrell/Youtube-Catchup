var token = null;

var tabID = null;

//Authorize
chrome.identity.getAuthToken({
    interactive: true
}, function(tkn) {
    if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
    }

    token = tkn;
});

function makePlaylist(openerTab, title, desc, videoIDs) {
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
            insertVideos(openerTab, data.id, videoIDs);
            var setData = {};
            setData[data.id] = {
                videos: []
            }
            chrome.storage.local.set(setData);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown, jqXHR.responseText);
        }
    });
}

function insertVideos(openerTab, playlistID, videos) {
    if (videos.length === 0) {
        return;
    }

    var video = videos.pop();

    $.ajax({
        "url": "https://www.googleapis.com/youtube/v3/playlistItems?alt=json&part=snippet&access_token=" + token,
        "method": "POST",
        "contentType": "application/json",
        "data": JSON.stringify({
            "snippet": {
                "playlistId": playlistID,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": video.id
                }
            }
        }),
        success: function(data, textStatus, jqXHR) {
            chrome.storage.local.get(playlistID,
                function (res) {
                    var playlistData = res[playlistID];
                    if (!playlistData) {
                        return; //Playlist has already been deleted
                    }
                    video.index = playlistData.videos.length;
                    playlistData.videos.push(video);
                    chrome.storage.local.set(res, function () {
                        if (playlistData.videos.length === 1)
                            chrome.tabs.create(
                                {
                                    url: "https://www.youtube.com/watch?v=" + video.id + "&list=" + playlistID,
                                    windowId: openerTab.windowId,
                                    index: openerTab.index+1,
                                    openerTabId: openerTab.id
                                },
                                function (tab) { tabCreatedCallback(tab, playlistID); }
                            );

                        if (videos.length > 0) {
                            insertVideos(openerTab, playlistID, videos);
                        } else {
                            console.log("done creating playlist");
                        }
                    });
                });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown, jqXHR.responseText);
        }
    });
}

function tabCreatedCallback(tab, playlistID) {
    chrome.tabs.executeScript(tab.tabID, { file: "jquery-3.0.0.min.js" }, function() {
        chrome.tabs.executeScript(tab.tabID, { file: "updatePlaylist.js", runAt: "document_end" });
    });

    chrome.tabs.onRemoved.addListener(function (tabID) {
        if (tab.id == tabID) {
            console.log("deleting playlist");
            chrome.storage.local.remove(playlistID);
            deletePlaylist(playlistID);
        }
    });
}

// When the button is clicked...
chrome.browserAction.onClicked.addListener(function (tab) {
    if (/^https?:\/\/(?:[^./?#]+\.)?youtube\.com\/user\/[^./?#]+\/videos/.test(tab.url)) {
        //On a youtube user videos page
        chrome.tabs.executeScript(null, { file: "jquery-3.0.0.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "findUnwatched.js" }, function (unwatched) { processUnwatched (tab, unwatched); });
        });
    }
});

function processUnwatched(tab, unwatched) {
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
    makePlaylist(tab, "Youtube Catchup", "Temporary playlist created by youtube catchup", unwatched);
}

function deletePlaylist(playlistID) {
    $.ajax({
        "url": "https://www.googleapis.com/youtube/v3/playlists?access_token=" + token + "&id=" + playlistID,
        "method": "DELETE",
        success: function(data, textStatus, jqXHR) {
            console.log(playlistID, "deleted");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown, jqXHR.responseText);
        }
    });
}

