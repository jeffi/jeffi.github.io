// Text file loader plugin.
define(function() {
    "use strict";
    return {
        load : function (name, parent, onload, config) {
            var url = parent.toUrl(name + ".glsl");
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function (evt) {
                if (xhr.readyState === 4) {
                    if (xhr.status !== 200) {
                        onload.error("status: "+xhr.status+" "+xhr.statusText);
                        return;
                    }

                    var text = xhr.responseText;
                    onload(text);
                }
            };
            xhr.send(null);
        }
    };
});
