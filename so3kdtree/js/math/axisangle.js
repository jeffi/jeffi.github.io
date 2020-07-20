define(function() {
    // Stored in [axis, angle] form, e.g. [x,y,z,angle]

    // function a(r,c) {
    // }

    // compile(
    //     function (expr) {
    //         return eval(expr);
    //     },
    //     ["m4", "r,a", [
    //         "var x = ${a(2,1)} - ${a(1,2)};",
    //         "var y = ${a(0,2)} - ${a(2,0)};",
    //         "var z = ${a(1,0)} - ${a(0,1)};",
    //         "var d = x*x + y*y + z*z;",
    //         "if (d > $epsilon) {"
    //         "d = Math.sqrt(d);",
    //         "var s = 0.5 * d;",
    //         "var d = 0.5 * (${a(0,0)} + ${a(1,1)}, + ${a(2,2)} - 1);",
    //         "r[3] = Math.atan2(s, c);",
    //         "d = 1/d;",
    //         "r[0] = x*d;",
    //         "r[1] = y*d;",
    //         "r[2] = z*d;",
    //         "} else {"
    //         "}"
    //     ]]);

    return {
        m4rotation : function (r, a) {
            var x = a[21] - a[12],
                y = a[02] - a[20],
                z = a[10] - a[01],
                d = x*x + y*y + z*z;

            if (d > 1e-12) {
                d = Math.sqrt(d);
                var s = 0.5 * d,
                    c = 0.5 * (a[00] + a[11] + a[22] - 1);

                r[3] = Math.atan2(s, c);
                d = 1/d;
                r[0] = x * d;
                r[1] = y * d;
                r[2] = z * d;
            } else {
                r[0] = 0;
                r[1] = 0;
                r[2] = 1;
                r[3] = 0;
            }
        },

        q4rotation : function (r, a) {
            var d = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
            if (d > 1e-12) {
                d = Math.sqrt(d);
                var b = 1/d;
                r[0] = a[0] * d;
                r[1] = a[1] * d;
                r[2] = a[2] * d;
                r[3] = 2*Math.atan2(d, a[3]);
            } else {
                r[0] = 0;
                r[1] = 0;
                r[2] = 1;
                r[3] = 0;
            }
        }
    };
});
