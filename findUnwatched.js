function extractData() {
    return {
        id: /\?v=[^&]{11}/.exec($(this).attr("href"))[0].substring(3),
        title: $(this).attr("title"),
        username: /\/user\/[^\/]+/.exec(document.location.href)[0].substring(6)
    }
}

var names = $("#channels-browse-content-grid>li:not(:has(.watched-badge))").find(".yt-lockup-content").find("a").map(extractData);
names.get();