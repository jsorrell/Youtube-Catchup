function sendBatchGapiRequest(requests, oauth2Token, success, failure) {
    var boundary = "---------------------------" + (new Date).getTime();//boundary is used to specify the encapsulation boundary of a parameter
    var uuid = guid();
    var xhr = new XMLHttpRequest();
    xhr.open("post", "https://www.googleapis.com/batch", true);
    xhr.setRequestHeader("Content-Type", "multipart/mixed; boundary=\"" + boundary + "\"");
    xhr.setRequestHeader("Authorization", "Bearer " + oauth2Token)
    var data = "";

    requests.forEach(function (obj, idx) {
        if (!obj.contentType) {
            obj.contentType = "application/json";
        }

        data += "--" + boundary + "\r\n";
        data += "Content-Type: application/http\r\n";
        data += "Content-Transfer-Encoding: binary\r\n";
        data += "Content-ID: <" + uuid + "+" + idx + ">\r\n\r\n";
        data += obj.method.toUpperCase() + " " + obj.url + "\r\n";
        data += "Content-Type: " + obj.contentType + "\r\n";
        data += "Authorization: Bearer " + oauth2Token + "\r\n";
        data += "accept: application/json\n";
        data += "content-length: " + obj.data.length + "\r\n\r\n";
        data += obj.data + "\r\n";
    });
    data += "--" + boundary + "--\r\n";

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                if (success) {
                    success(parseResponse(xhr.responseText), xhr.responseText);
                }
            }
            else {
                if (failure)
                    failure(xhr.status, xhr.responseText);
            }
        }
    };

    xhr.send(data);
}

function parseResponse(responseText) {
    function skipToNext(splitResp) {
        while (splitResp.shift() != "--" + boundary && splitResp.shift() != "--" + boundary + "--")
            splitResp.shift();
    }

    var splitResp = responseText.split("\r\n");
    var respObjs = [];
    var boundary = splitResp[0].substring(2);

    while (splitResp.shift() == "--" + boundary) {
        splitResp.shift(); //Content type
        var idx = /\+\d+>/.exec(splitResp.shift())[0].slice(1, -1);
        splitResp.shift(); //empty line
        var status = splitResp.shift().substring(9, 12);
        if (status != 200) {
            respObjs[idx] = {
                status: status
            }
            skipToNext(splitResp);
            continue;
        }

        splitResp.shift(); //Etag
        splitResp.shift(); //Content type
        splitResp.shift(); //Date
        splitResp.shift(); //Expires
        splitResp.shift(); //Cache control
        splitResp.shift(); //Content length
        splitResp.shift(); //Empty line

        var data = splitResp.shift();
        respObjs[idx] = {
            status: 200,
            data: JSON.parse(data)
        }
    }

    return respObjs;
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}