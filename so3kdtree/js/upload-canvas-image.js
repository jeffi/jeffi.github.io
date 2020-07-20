define(function() {

    function uploadFile(file, contentType, url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (200 <= xhr.status && xhr.status < 300) {
                    callback(null, {url:url, size:file.size});
                } else {
                    callback({httpStatus:xhr.status}, null);
                }
            }
        };
        if (xhr.upload) {
            xhr.upload.onprogress = function(evt) {
                if (evt.lengthComputable) {
                    console.log("upload progress: "+(evt.loaded * 100 / evt.total)+" %");
                }
            };
        }
        try {
            xhr.send(file);
        } catch (e) {
            callback(e, null);
        }
    }

    return function (canvas, url, callback) {
        var dataURL = this.canvas.toDataURL("image/png");
        console.log(dataURL);

        //             mime-type                     encoding  data...
        var m = /^data:([^,;]+(?:;charset=([^,;]*))?)(;base64)?,/.exec(dataURL)
        if (!m) {
            console.log("failed to parse data url!");
            return false;
        }

        console.log(dataURL.length, m);
        var mimeType = m[1];
           
        var data = dataURL.substr(m[0].length);
        if (m[3]) {
            // base64
            data = atob(data);
        } else {
            // %hex octets
            data = decodeURIComponent(data);
        }
            
        // convert the data string to a blob
        var n = data.length;
        var b = new Uint8Array(n);
        for (var i=0 ; i<n ; ++i) {
            b[i] = data.charCodeAt(i);
        }

        var file = new Blob([b], {type:mimeType});
        
        console.log(file);

        uploadFile(file, mimeType, url, callback);
    };
});
