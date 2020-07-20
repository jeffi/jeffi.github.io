define(["./makemat"], function(makemat) {
    var m4 = makemat(4,4);
    m4.translate = function translate(r,a,x,y,z) {
        if('undefined' === typeof y) {
            z = x[2];
            y = x[1];
            x = x[0];
        }
        if (r === a) {
            r[12] += a[0]*x+a[4]*y+a[8]*z;
            r[13] += a[1]*x+a[5]*y+a[9]*z;
            r[14] += a[2]*x+a[6]*y+a[10]*z;
            r[15] += a[3]*x+a[7]*y+a[11]*z;
        } else {
            r[12] = (r[0] = a[0])*x+(r[4] = a[4])*y+(r[8] = a[8])*z+a[12];
            r[13] = (r[1] = a[1])*x+(r[5] = a[5])*y+(r[9] = a[9])*z+a[13];
            r[14] = (r[2] = a[2])*x+(r[6] = a[6])*y+(r[10] = a[10])*z+a[14];
            r[15] = (r[3] = a[3])*x+(r[7] = a[7])*y+(r[11] = a[11])*z+a[15];
        }
        return r;
    };

    m4.scale = function (r,a,x,y,z) {
        if('undefined' === typeof y) {
            if ('number' === typeof x) {
                y = z = x;
            } else {
                z = x[2];
                y = x[1];
                x = x[0];
            }
        }
        if (r === a) {
            r[0] *= x;
            r[1] *= x;
            r[2] *= x;
            r[3] *= x;
            r[4] *= y;
            r[5] *= y;
            r[6] *= y;
            r[7] *= y;
            r[8] *= z;
            r[9] *= z;
            r[10] *= z;
            r[11] *= z;
        } else {
            r[0] = a[0] * x;
            r[1] = a[1] * x;
            r[2] = a[2] * x;
            r[3] = a[3] * x;
            r[4] = a[4] * y;
            r[5] = a[5] * y;
            r[6] = a[6] * y;
            r[7] = a[7] * y;
            r[8] = a[8] * z;
            r[9] = a[9] * z;
            r[10] = a[10] * z;
            r[11] = a[11] * z;
            r[12] = a[12];
            r[13] = a[13];
            r[14] = a[14];
            r[15] = a[15];
        }
        return r;
    };

    m4.invert2 = function (r, a) {
        var a00 = a[0];
        var a01 = a[1];
        var a02 = a[2];
        var a03 = a[3];
        var a10 = a[4];
        var a11 = a[5];
        var a12 = a[6];
        var a13 = a[7];
        var a20 = a[8];
        var a21 = a[9];
        var a22 = a[10];
        var a23 = a[11];
        var a30 = a[12];
        var a31 = a[13];
        var a32 = a[14];
        var a33 = a[15];

        var a = a00 * a11 - a01 * a10;
        var d = a00 * a12 - a02 * a10;
        var e = a00 * a13 - a03 * a10;
        var g = a01 * a12 - a02 * a11;
        var i = a01 * a13 - a03 * a11;
        var k = a02 * a13 - a03 * a12;
        var h = a20 * a33 - a23 * a30;
        var l = a20 * a31 - a21 * a30;
        var j = a22 * a30 - a20 * a32;
        var f = a22 * a31 - a21 * a32;
        var b = a22 * a33 - a23 * a32;
        var c = a23 * a31 - a21 * a33;

        var det = a * b
                + d * c
                - e * f
                + g * h
                + i * j
                + k * l;

        r[0] = (a11 * b + a12 * c - a13 * f) / det;
        r[1] = (a03 * f - a01 * b - a02 * c) / det;
        r[2] = (g * a33 + k * a31 - i * a32) / det;
        r[3] = (i * a22 - g * a23 - k * a21) / det;

        r[4] = (a12 * h + a13 * j - a10 * b) / det;
        r[5] = (a00 * b - a02 * h - a03 * j) / det;
        r[6] = (e * a32 - d * a33 - k * a30) / det;
        r[7] = (d * a23 + k * a20 - e * a22) / det;

        r[8] = (a13 * l - a10 * c - a11 * h) / det;
        r[9] = (a00 * c + a01 * h - a03 * l) / det;
        r[10] = (a * a33 + i * a30 - e * a31) / det;
        r[11] = (e * a21 - a * a23 - i * a20) / det;

        r[12] = (a10 * f - a11 * j - a12 * l) / det;
        r[13] = (a01 * j + a02 * l - a00 * f) / det;
        r[14] = (d * a31 - a * a32 - g * a30) / det;
        r[15] = (a * a22 + g * a20 - d * a21) / det;
    };


    return m4;
});
