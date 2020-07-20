define(["./v4"], function(v4) {
    var q4 = {};
    for (var i in v4) {
        if (v4.hasOwnProperty(i)) {
            q4[i] = v4[i];
        }
    }

    // [3,4].forEach(function(n) {
    //     q4["m"+n] = eval([
    //         "(function(r,m){",
    //         "var trace = m[0] + m["+(n+1)+"] + m["+(n*2+2)+"];",
    //         "if (trace > 0) {",
    //         "var root = Math.sqrt(trace+1);",
    //         "r[3] = root * 0.5;",
    //         "root = 0.5 / root;",
    //         "r[0] = (m["+(n  +2)+"] - m["+(n*2+1)+"]) * root;",
    //         "r[1] = (m["+(n*2  )+"] - m["+(    2)+"]) * root;",
    //         "r[2] = (m["+(    1)+"] - m["+(n    )+"]) * root;",
    //         "} else {",
    //         "var i = (m["+(n+1)+"] > m[0]) ? 1 : 0;"
    //         "if (m["+(n*2+2)+"] > m[i*"+n+"+i]) i = 2;",
    //         "var j = (i+1)%3;",
    //         "var k = (i+2)%3;",
    //         (n == 3
    //          ? "root = Math.sqrt(m[i<<2] - m[j<<2] - m[k<<2] + 1);"
    //          : "root = Math.sqrt(m[i*5] - m[j*5] - m[k*5] + 1);")
    //         "r[i] = root * 0.5;",
    //         "root = 0.5 / root;",
    //         "r[3] = (m[j*"+n+"+k] - m[k*"+n+"+j]) * root;"
    //         "r[j] = (m[j*"+n+"+i] + m[i*"+n+"+j]) * root;"
    //         "r[k] = (m[k*"+n+"+i] + m[i*"+n+"+k]) * root;"
    //         "}",
    //         "})"].join("\n"));
    // });
    
    return {
        identity : function(r) {
            r[0] = r[1] = r[2] = 0;
            r[3] = 1;
        },

        arcLength : function (a, b) {
            return Math.acos(Math.abs(dot(a, b)));
        },

        randomize : function(r, rnd) {
            rnd = rnd || Math.random;
            var x0 = rnd(),
                r1 = Math.sqrt(1 - x0),
                r2 = Math.sqrt(x0),
                t1 = 2 * Math.PI * rnd(),
                t2 = 2 * Math.PI * rnd(),
                c1 = Math.cos(t1),
                s1 = Math.sin(t1),
                c2 = Math.cos(t2),
                s2 = Math.sin(t2);

            r[0] = s1 * r1;
            r[1] = c1 * r1;
            r[2] = s2 * r2;
            r[3] = c2 * r2;
        },

        conjugate : function (r, a) {
            r[0] = -a[0];
            r[1] = -a[1];
            r[2] = -a[2];
            r[3] = a[3];
        },

        inverse : function (r,a) {
            var a0 = a[0],
                a1 = a[1],
                a2 = a[2],
                a3 = a[3],
                s = 1 / (a0*a0 + a1*a1 + a2*a2 + a3*a3);

            r[0] = -s * a0;
            r[1] = -s * a1;
            r[2] = -s * a2;
            r[3] = s * a3;
        },

        mul : function (r, a, b) {
            var a0 = a[0],
                a1 = a[1],
                a2 = a[2],
                a3 = a[3],
                b0 = b[0],
                b1 = b[1],
                b2 = b[2],
                b3 = b[3];

            r[0] = a3*b0 + a0*b3 + a1*b2 - a2*b1;
            r[1] = a3*b1 + a1*b3 - a0*b2 + a2*b0;
            r[2] = a3*b2 + a2*b3 + a0*b1 - a1*b0;
            r[3] = a3*b3 - a0*b0 - a1*b1 - a2*b2;
        },
        
        interpolate : function (r, q0, q1, t) {
            var dot = dot(q0, q1);
            
            if (dot >= (1 - epsilon)) {
                return this.copyFrom(q0);
            }

            var theta = Math.acos(Math.abs(dot));
            var d = 1 / Math.sin(theta);
            var s0 = Math.sin((1.0 - t) * theta);
            var s1 = Math.sin(t * theta);

            if (dot < 0) {
                // long angle case
                s1 = -s1;
            }

            for (var i=0 ; i<4 ; ++i) {
                r[i] = (q0[i] * s0 + q1[i] * s1) * d;
            }
        },

        midPoint : function (r, q0, q1) {
            var s = 0.707106781186548 / Math.sqrt(1 + q0.dot(q1));

            for (var i=0 ; i<4 ; ++i) {
                r[i] = (q0[i] + q1[i]) * s;
            }
        },

        axisAngle : function (r, axis, angle) {
            angle /= 2;
            r[3] = Math.cos(angle);
            var s = 1 / Math.sin(angle);
            r[0] = axis[0] * s;
            r[1] = axis[1] * s;
            r[2] = axis[2] * s;
        }

        // m3 : function (r, m) {
        //     var trace = m[0] + m[4] + m[8];
            
        //     if (trace > 0) {
        //         var root = Math.sqrt(trace + 1);
        //         r[3] = root * 0.5;
        //         root = 0.5 / root;
        //         r[0] = (m[5] - m[7]) * root;
        //         r[1] = (m[6] - m[2]) * root;
        //         r[2] = (m[1] - m[3]) * root;
        //     } else {
        //         var i = 0;
        //         if (m[4] > m[0])
        //             i = 1;
        //         if (m[8] > m[i*3+i])
        //             i = 2;
        //         var j = (i+1)%3;
        //         var k = (i+2)%3;

        //         // var root = Math.sqrt(m[i*3+i] - m[j*3+j] - m[k*3+k] + 1);
        //         var root = Math.sqrt(m[i<<2] - m[j<<2] - m[k<<2] + 1);
        //         r[i] = root * 0.5;
        //         root = 0.5 / root;
        //         r[3] = (m[j*3+k] - m[k*3+j]) * root;
        //         r[j] = (m[j*3+i] + m[i*3+j]) * root;
        //         r[k] = (m[k*3+i] + m[i*3+k]) * root;
        //     }
        // }
    };
});
