define(function() {
    function flatten(source) {
        return (source instanceof Array)
            ? source.filter(function(x) { return x; }).map(flatten).join("\n")
            : source;
    }

    function ifelse(c,t,f) {
        return ["if("+c+") {", t, "} else {", f, "}"];
    }

    return function (rows,cols) {
        var module = {};
        cols = cols || 1;

        function compile(name, args, source) {
            var fn = "(function "+name+" ("+args+") {\n" + flatten(source) + "\n})";
            // console.log(fn);
            module[name] = eval(fn);
        }

        var n = rows*cols;

        function F(fn) {
            switch (typeof fn) {
            case 'function': return fn;
            case 'string': return function(v,i) {
                var a = [i].concat(v);
                var re = new RegExp("(\\d+)"+new Array(a.length).join(",(.*)"));
                return a.join().replace(re, fn);
            };
            }
        }

        function rep(fn) {
            if ("string" === typeof fn) {
                var str = fn;
                fn = function(i,r,c) {
                    return [i,r,c].toString().replace(/(\d*),(\d*),(\d*)/g, str);
                };
            }
            for(var r=[], i=0 ; i<rows ; ++i)
                for (var j=0 ; j<cols ; ++j)
                    r.push(fn(i*cols+j,i,j));
            return r;
        }

        function vec(fn) {
            for (var r=[], i=0 ; i<rows ; ++i)
                r.push(fn(i));
            return r;
        }

        function indexed(name) {
            return function(r,c) {
                if ("undefined" === typeof c) {
                    return name+"["+r+"]";
                } else {
                    return name+"["+(r*cols+c)+"]";
                }
            };
        }

        var R = indexed("r");
        var A = indexed("a");

        var epsilon = 1e-12;
        var epsilon2 = epsilon*epsilon;

        function dot(a, b) {
            return rep(a+"[$1]*"+b+"[$1]").join(" + ");
        }

        compile("copy", "r,a", rep("r[$1] = a[$1];"));
        compile("zero", "r", rep("r[$1] = 0;"));
        compile("fill", "r,v", rep("r[$1] = v;"));

        function componentWiseOp(name, op) {
            compile(name, "r,a,b",
                    ifelse("r===a",
                           rep("r[$1] "+op+"= b[$1];"),
                           rep("r[$1] = a[$1] "+op+" b[$1];")));
        }

        componentWiseOp("add", "+");
        componentWiseOp("sub", "-");

        function componentWiseScalarOp(name, op) {
            compile(name, "r,a,s",
                    ifelse("r===a",
                           rep("r[$1] "+op+"= s;"),
                           rep("r[$1] = a[$1] "+op+" s;")));
        }

        componentWiseScalarOp("scale", "*");
        componentWiseScalarOp("invScale", "/");

        compile("addScale", "r,s,a,b", rep("r[$1] = s*a[$1] + b[$1];"));
        compile("clamp", "r,a,min,max",
                rep("r[$1] = Math.min(max, Math.max(min, a[$1]));"));
        compile("clampMin", "r,a,min",
                rep("r[$1] = Math.max(min, a[$1]);"));
        compile("clampMax", "r,a,max",
                rep("r[$1] = Math.min(max, a[$1]);"));
        compile("abs", "r,a", rep("r[$1] = Math.abs(a[$1]);"));
        compile("negate", "r,a", rep("r[$1] = -a[$1];"));
        compile("max", "r,a,b", rep("r[$1] = Math.max(a[$1],b[$1]);"));
        compile("min", "r,a,b", rep("r[$1] = Math.min(a[$1],b[$1]);"));


        // Generates an L2 distance.  The provided function is
        // appended to the return value after passing in the L2
        // squared distance.
        function L2(fn) {
            return [
                rep("var d$1 = a[$1] - b[$1];"),
                fn(rep("d$1*d$1").join(" + "))
            ];
        }

        function norm2(fn) {
            return [
                rep("var a$1 = a[$1];"),
                fn(rep("a$1*a$1").join("+"))
            ];
        }

        function coeff(name, comp) {
            var impl = [ "var i=a[0]"+comp+"a[1]?0:1;" ];
            for (var i=2 ; i+1 < n ; ++i) {
                impl.push("if(a["+i+"]"+comp+"a[i]) i="+i+";");
            }
            impl.push("return a["+i+"]"+comp+"a[i]?"+i+":i;");
            return compile(name+"Coeff", "a", impl);
        }


        // A vector
        if (rows === 1 || cols === 1) {
            compile("dot", "a,b", "return "+dot("a","b")+";");

            compile("dist", "a,b", L2(function(d) { return "return Math.sqrt("+d+");" }));
            compile("dist2", "a,b", L2(function(d) { return "return "+d+";" }));

            compile("distL1", "a,b", "return "+rep("Math.abs(a[$1]-b[$1])").join(" + ") + ";");
            compile("distLinf", "a,b", "return Math.max("+
                    rep("Math.abs(a[$1]-b[$1])").join(", ") + ");");

            compile("norm", "a", norm2(function(n) { return "return Math.sqrt("+n+");"; }));
            compile("norm2", "a", norm2(function(n) { return "return "+n+";"}));
            compile("normalize", "r,a", [
                norm2(function(n) { return "var n = Math.sqrt("+n+");" }),
                ifelse("n-1",
                       [
                           "n=1/n;",
                           rep("r[$1] = a$1*n;")
                       ],
                       [
                           "if (r!==a) {",
                           rep("r[$1] = a$1;"),
                           "}"
                       ])
            ]);
            compile("interpolate", "r,a,b,t", [
                "var s = 1-t;",
                rep("r[$1]=s*a[$1]+t*b[$1];")
            ]);
            coeff("max", ">");
            coeff("min", "<");
        }

        // A n x n matrix
        if (rows === cols) {
            compile("identity", "r",
                    rep(function(i,r,c) { return "r["+i+"] = "+(r===c?1:0)+";" }));

            compile("transpose", "r,a",
                    ifelse("r===a",
                           [
                               rep(function(i,r,c) {
                                   var j = c*rows + r;
                                   return r<c &&
                                       "var t = r["+i+"]; r["+i+"] = r["+j+"]; r["+j+"] = t;"
                               })
                           ],
                           rep(function(i,r,c) {
                               return "r["+i+"] = a["+(c*rows + r)+"]";
                           })));

            compile("mul", "r,a,b", [
                rep("var a$2$3 = a[$1];"),
                vec(function(r) {
                    return [ 
                        vec(function(c) {
                            return (!r?"var ":"") + "b"+c+" = b["+(r*cols+c)+"];";
                        }),
                        vec(function(c) {
                            return "r["+(r*cols+c)+"] = "+
                                vec(function(k) { return "b"+k+"*a"+k+c; }).join(" + ") + ";";
                        })
                    ];
                })
            ]);

            // Matrix Rotation Functions
            if (rows === 3 || rows === 4) {
                compile("rotate", "r,a,x,y,z,angle", [
                    "var len = x*x + y*y + z*z;",
                    "if (len < "+epsilon2+") return;",
                    "if (Math.abs(len-1) > "+epsilon+") {",
                    "len=1/Math.sqrt(len);",
                    "x *= len;",
                    "y *= len;",
                    "z *= len;",
                    "}",
                    "var s = Math.sin(angle),",
                    "c = Math.cos(angle),",
                    "t = 1 - c,",
                    "xt = x * t,",
                    "yt = y * t,",
                    "zt = z * t,",
                    "xs = x * s,",
                    "ys = y * s,",
                    "zs = z * s,",
                    "b00 = x * xt + c,",
                    "b01 = y * xt + zs,",
                    "b02 = z * xt - ys,",
                    "b10 = x * yt - zs,",
                    "b11 = y * yt + c,",
                    "b12 = z * yt + xs,",
                    "b20 = x * zt + ys,",
                    "b21 = y * zt - xs,",
                    "b22 = z * zt + c;",
                    [0,1,2,3].map(function(r) {
                        return r<rows &&[
                            "var t0 = a["+r+"];",
                            "var t1 = a["+(r+rows)+"];",
                            "var t2 = a["+(r+rows*2)+"];",
                            "r["+r+"] = t0 * b00 + t1 * b01 + t2 * b02;",
                            "r["+(r+rows)+"] = t0 * b10 + t1 * b11 + t2 * b12;",
                            "r["+(r+rows*2)+"] = t0 * b20 + t1 * b21 + t2 * b22;",
                        ];
                    }),
                    (rows === 4) && [
                        "if(a!==r){",
                        [12,13,14,15].map(function(i) { return "r["+i+"] = a["+i+"];"; }),
                        "}"
                    ]
                ]);

                ["X","Y","Z"].forEach(function(X,x) {
                    var y = (x+1)%3;
                    var z = (x+2)%3;
                    compile("rotate"+X, "r,a,angle", [
                        "var s = Math.sin(angle);",
                        "var c = Math.cos(angle);",
                        [0,1,2,3].map(function(i) {
                            return [
                                "var i = "+A(y,i)+";",
                                "var j = "+A(z,i)+";",
                                R(y,i)+" = i*c + j*s;",
                                R(z,i)+" = j*c - i*s;"
                            ];
                        }),
                        (rows === 4) && [
                            "if(a!==r){",
                            rep(function(i,r) { if (r===x||r===3) return R(i)+" = "+A(i)+";"; }),
                            "}"
                        ]
                    ]);
                });

                compile("fromQ4v1", "r,q", [
                    "var a = q[3],",
                    "b = q[0],",
                    "c = q[1],",
                    "d = q[1],",
                    "aa = a*a,",
                    "bb = b*b,",
                    "cc = c*c,",
                    "dd = d*d,",
                    "ab2 = (a*=2)*b,",
                    "ac2 = a*c,",
                    "ad2 = a*d,",
                    "bc2 = (b*=2)*c,",
                    "bd2 = b*d,",
                    "cd2 = c*d*2;",

                    R(0,0)+" = aa+bb-cc-dd;",
                    R(0,1)+" = bc2-ad2;",
                    R(0,2)+" = bd2+ac2;",
                    R(1,0)+" = bc2+ad2;",
                    R(1,1)+" = aa-bb+cc-dd;",
                    R(1,2)+" = cd2-ab2;",
                    R(2,0)+" = bd2-ac2;",
                    R(2,1)+" = cd2+ab2;",
                    R(2,2)+" = aa-bb-cc+dd;",

                    (rows === 4) && [
                        "r[12] = 0;",
                        "r[13] = 0;",
                        "r[14] = 0;",
                        "r[15] = 1;"
                    ]                        
                ]);

                compile("fromQ4", "r,q", [
                    "var x = q[0], y = q[1], z = q[2], w = q[3],",
                    // optionally:
                    // n = w*w + x*x + y*y + z*z,
                    // s = n && 2/n, (then multiply by s instead of 2 below)
                    "wx = 2*w*x,",
                    "wy = 2*w*y,",
                    "wz = 2*w*z,",
                    "xx = 2*x*x,",
                    "xy = 2*x*y,",
                    "xz = 2*x*z,",
                    "yy = 2*y*y,",
                    "yz = 2*y*z,",
                    "zz = 2*z*z;",

                    R(0,0)+"=1-yy-xx;",
                    R(0,1)+"=xy-wz;",
                    R(0,2)+"=xz+wy;",
                    R(1,0)+"=xy+wz;",
                    R(1,1)+"=1-xx-zz;",
                    R(1,2)+"=yz-wx;",
                    R(2,0)+"=xz-wy;",
                    R(2,1)+"=yz+wx;",
                    R(2,2)+"=1-xx-yy;"
                ]);
            }

            switch (rows) {
            case 2:
                compile("det", "a", [
                    "return "+A(0,0)+"*"+A(1,1)+" - "+A(0,1)+"*"+A(1,0)+";"
                ]);
                break;
            case 3:
                compile("det", "a", [
                    rep("var a$2$3 = a[$1];"),
                    "return a00*a11*a22 + a10*a21*a02 + a20*a01*a12 - a00*a21*a12 - a20*a11*a02 - a10*a01*a22;"
                ]);
                break;
            case 4:
                compile("det", "a", [
                    rep("var a$2$3 = a[$1];"),
                    "return "+[
                        "(a00 * a11 - a01 * a10) * (a22 * a33 - a23 * a32)",
                        "(a00 * a12 - a02 * a10) * (a23 * a31 - a21 * a33)",
                        "(a00 * a13 - a03 * a10) * (a21 * a32 - a22 * a31)",
                        "(a01 * a12 - a02 * a11) * (a20 * a33 - a23 * a30)",
                        "(a01 * a13 - a03 * a11) * (a22 * a30 - a20 * a32)",
                        "(a02 * a13 - a03 * a12) * (a20 * a31 - a21 * a30)"
                    ].join(" +\n")+";"
                ]);
                break;
            }

            // unique implementations to 4x4 matricies
            if (rows === 4) {
                compile("invert", "r,a", [
                    rep("var a$2$3 = a[$1];"),
                    "var b00 = a00 * a11 - a01 * a10,",
                    "b01 = a00 * a12 - a02 * a10,",
                    "b02 = a00 * a13 - a03 * a10,",
                    "b03 = a01 * a12 - a02 * a11,",
                    "b04 = a01 * a13 - a03 * a11,",
                    "b05 = a02 * a13 - a03 * a12,",
                    "b06 = a20 * a31 - a21 * a30,",
                    "b07 = a20 * a32 - a22 * a30,",
                    "b08 = a20 * a33 - a23 * a30,",
                    "b09 = a21 * a32 - a22 * a31,",
                    "b10 = a21 * a33 - a23 * a31,",
                    "b11 = a22 * a33 - a23 * a32,",
                // Calculate the determinant
                    "det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;",
                    "if (det) {",
                    "det = 1/det;",
                    "r[ 0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;",
                    "r[ 1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;",
                    "r[ 2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;",
                    "r[ 3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;",
                    "r[ 4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;",
                    "r[ 5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;",
                    "r[ 6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;",
                    "r[ 7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;",
                    "r[ 8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;",
                    "r[ 9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;",
                    "r[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;",
                    "r[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;",
                    "r[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;",
                    "r[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;",
                    "r[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;",
                    "r[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;",
                    "}"
                ]);

                compile("perspective", "r,fovy,aspect,near,far", [
                    // "var f = 1/Math.atan2(fovy,2);",
                    "var f = 1/Math.tan(fovy);",
                    "var n = 1/(near - far);",
                    rep(function(i) {
                        return "r["+i+"] = "+({
                            0 : "f/aspect",
                            5 : "f",
                            10 : "(far + near) * n",
                            11 : "-1",
                            14 : "2 * far * near * n"
                        }[i] || "0")+";";
                    })
                ]);

                module["lookAt"] = function(r, eye, center, up) {
                    var e0 = eye[0],
                        e1 = eye[1],
                        e2 = eye[2],

                        z0 = e0 - center[0],
                        z1 = e1 - center[1],
                        z2 = e2 - center[2],

                        len = Math.sqrt(z0*z0 + z1*z1 + z2*z2);

                    if (len < 1e-12) {
                        // throw exception?
                        return identity(r);
                    }

                    z0 /= len;
                    z1 /= len;
                    z2 /= len;

                    var x0 = up[1] * z2 - up[2] * z1,
                        x1 = up[2] * z0 - up[0] * z2,
                        x2 = up[0] * z1 - up[1] * z0;

                    len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
                    if (len < 1e-12) {
                        x0 = x1 = x2 = 0;
                    } else {
                        x0 /= len;
                        x1 /= len;
                        x2 /= len;
                    }

                    var y0 = z1 * x2 - z2 * x1,
                        y1 = z2 * x0 - z0 * x2,
                        y2 = z0 * x1 - z1 * x0;

                    len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);

                    if (len < 1e-12) {
                        y0 = y1 = y2 = 0;
                    } else {
                        y0 /= len;
                        y1 /= len;
                        y2 /= len;
                    }

                    r[ 0] = x0;
                    r[ 1] = y0;
                    r[ 2] = z0;
                    r[ 3] = 0;

                    r[ 4] = x1;
                    r[ 5] = y1;
                    r[ 6] = z1;
                    r[ 7] = 0;

                    r[ 8] = x2;
                    r[ 9] = y2;
                    r[10] = z2;
                    r[11] = 0;

                    e0 = -e0;

                    r[12] = x0 * e0 - x1 * e1 - x2 * e2;
                    r[13] = y0 * e0 - y1 * e1 - y2 * e2;
                    r[14] = z0 * e0 - z1 * e1 - z2 * e2;
                    r[15] = 1;

                    return r;
                };
            }
        }

        return module;
    };
});
