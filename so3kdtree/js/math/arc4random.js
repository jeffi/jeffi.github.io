define(function() {
    var initialized = 0;
    var stirred = 0;
    var i;
    var j;
    var s;

    var min = Infinity;
    var max = -Infinity;
    var sum = 0;
    var count = 0;

    function init() {
        initialized = 1;
        s = new Uint8Array(256);
        for (var n=0 ; n<256 ; ++n) {
            s[n] = n;
        }
        i = j = 0;
    }

    function addrandom(dat) {
        var datalen = dat.length;
        for (var n=0 ; n<256 ; ++n) {
            i = (i + 1) & 255;
            var si = s[i];
            j = (j + si + dat[n % datalen]) & 255;
            s[i] = s[j];
            s[j] = si;
        }
    }

    function stir() {
        var t = Date.now();
        var buf = new Uint8Array(4);
        buf[0] = t;
        buf[1] = (t>>>=8);
        buf[2] = (t>>>=8);
        buf[3] = (t>>>8);
        addrandom(buf);
        drain();
        stirred = 1;
    }
    
    function drain() {
        for (var n=0 ; n<1024 ; ++n) {
            getbyte();
        }
    }

    function getbyte() {
        i = (i + 1) & 255;
        var si = s[i];
        j = (j + si) & 255;
        var sj = s[j];
        s[i] = sj;
        s[j] = si;

        // console.log(si,sj,(si+sj)&255,s[(si+sj) & 255]);

        return s[(si + sj) & 255];
    }

    function getword() {
        var v = getbyte() << 24;
        v |= getbyte() << 16;
        v |= getbyte() << 8;
        v |= getbyte();
        return v;
    }

    function checkInitAndStir() {
        if (!initialized) {
            init();
        }
        if (!stirred) {
            stir();
        }
    }

    return {
        seed : function(t) {
            if (!initialized) init();
            var buf = new Uint8Array(4);
            buf[0] = t;
            buf[1] = (t>>>=8);
            buf[2] = (t>>>=8);
            buf[3] = (t>>>8);
            addrandom(buf);
            drain();
            stirred = 1;
        },
        random32 : function() {
            checkInitAndStir();
            return getword();
        },
        random : function() {
            checkInitAndStir();

            // 53 bits of pseudo-randomness
            var v = (getbyte() & 31) << 16; 
            v |= getbyte() << 8
            v |= getbyte();
            v = v * 4294967296 + getword();

            // divided by 1<<53
            v /= 9007199254740992;

            // min = Math.min(v, min);
            // max = Math.max(v, max);
            // sum += v;
            // count++;
            // console.log(v, min, max, sum/count);

            return v;
        }
    };
});
