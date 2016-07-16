function extractData() {
    urlString = /\?v=[^&]{11}/.exec($(this).attr("href"))[0];
    // return {
    //     "name": $(this).html(),
    //     "id": urlString.substring(3)
    // }
    return urlString.substring(3);
}

var names = $("#channels-browse-content-grid>li:not(:has(.watched-badge))").find(".yt-lockup-content").find("a").map(extractData);
names.get();