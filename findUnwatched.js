function findDataGrid() {
    function extractData() {
        return {
            id: /(?:\?v=)([^&]{11})/.exec($(this).attr("href"))[1],
            title: $(this).attr("title"),
            username: /(?:\/user\/)([^\/]+)/.exec(document.location.href)[1]
        }
    }
    var names = $("#channels-browse-content-grid>li:not(:has(.watched-badge))").find(".yt-lockup-content").find("a").map(extractData);
    return names.get();
}


function findDataList() {
    function extractData() {
        return {
            id: /(?:\?v=)([^&]{11})/.exec($(this).attr("href"))[1],
            title: $(this).attr("title"),
            username: /(?:\/user\/)([^\/]+)/.exec(document.location.href)[1]
        }
    }
    var names = $("#browse-items-primary>li.browse-list-item-container:not(:has(.watched-badge))").find(".yt-lockup-content").find("a.yt-uix-tile-link").map(extractData);
    return names.get();
}

$.fn.exists = function () {
    return this.length !== 0;
}

if ($(".browse-list-item-container").exists()) {
    console.log("list");
    findDataList();
} else if ($("#channels-browse-content-grid").exists()) {
    console.log("grid");
    findDataGrid();
} else {
    console.log("Can't understand page");
    null;
}