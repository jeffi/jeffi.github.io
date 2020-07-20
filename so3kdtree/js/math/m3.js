define(["./makemat"], function(makemat) {
    var m3 = makemat(3,3);

    m3.m4normal = function(r,a) {
        var a00 = a[ 0], a01 = a[ 1], a02 = a[ 2], a03 = a[ 3],
            a10 = a[ 4], a11 = a[ 5], a12 = a[ 6], a13 = a[ 7],
            a20 = a[ 8], a21 = a[ 9], a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,

            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,

            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,

            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            // TODO: throw something?
            return;
        }

        det = 1.0 / det;

        r[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        r[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        r[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
 
        r[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        r[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        r[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
 
        r[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        r[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        r[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    };

    console.log(m3);

    return m3;
});
