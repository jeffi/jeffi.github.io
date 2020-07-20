define(function() {
    var timeSource = performance || Date;

    return {
        getGLContext : function(canvas, attributes) {
            return ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"].reduce(function(p, c) {
                try {
                    return p || canvas.getContext(c, attributes);
                } catch (e) {}
            }, 0);
        },

        requestAnimationFrame : ["r", "webkitR", "mozR", "oR", "msR"].reduce(function(p, c) {
            return p || window[c + "equestAnimationFrame"];
        }, 0) || function(callback, elem) {
            window.setTimeout(callback, 1000/60);
        },

        timeInMillis : function() {
            return timeSource.now();
        }
    };
});
