define(["./makemat"], function(makemat) {
    var v4 = makemat(4,1);

    v4.m4transform = function(r, m, a) {
        var a0 = a[0],
            a1 = a[1],
            a2 = a[2],
            a3 = a[3];

        r[0] = m[0] * a0 + m[4] * a1 + m[8] * a2 + m[12] * a3;
        r[1] = m[1] * a0 + m[5] * a1 + m[9] * a2 + m[13] * a3;
        r[2] = m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14] * a3;
        r[3] = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15] * a3;
    };

    return v4;
});
