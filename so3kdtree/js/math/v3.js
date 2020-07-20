define(["./makemat"], function(makemat) {
    var v3 = makemat(3,1);
    v3.cross = function cross(r,a,b) {
        var ax = a[0],
            ay = a[1],
            az = a[2],
            bx = b[0],
            by = b[1],
            bz = b[2];

        r[0] = ay * bz - az * by;
        r[1] = az * bx - ax * bz;
        r[2] = ax * by - ay * bx;
    };
    v3.randomUnit = function(r, rnd) {
        if (!rnd) {
            rnd = Math.random;
        }

        var z = 2 * rnd() - 1;
        var t = 2 * Math.PI * rnd();
        var s = Math.sqrt(1 - z*z);

        r[0] = s * Math.cos(t);
        r[1] = s * Math.sin(t);
        r[2] = z;
    };

    v3.m4transform = function(r, m, a) {
        var ax = a[0],
            ay = a[1],
            az = a[2];
        r[0] = m[0] * ax + m[4] * ay + m[8] * az + m[12];
        r[1] = m[1] * ax + m[5] * ay + m[9] * az + m[13];
        r[2] = m[2] * ax + m[6] * ay + m[10] * az + m[14];
    };

    /**
     * Same computation as m4transform, but instead of populating a
     * result vector, only returns the transformed Z coordinate.
     * Useful for depth sorting.
     */
    v3.m4transformZ = function(m, a) {
        var ax = a[0],
            ay = a[1],
            az = a[2],
            iw = (m[3] * ax + m[7] * ay + m[11] * az + m[15]);
        return (m[2] * ax + m[6] * ay + m[10] * az + m[14]) / iw;        
    };

    return v3;
});
