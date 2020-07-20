define(function() {
    function flatten(source) {
        return (source instanceof Array)
            ? source.filter(function(x) { return x; }).map(flatten).join("\n")
            : source;
    }

    function compile(name, args, source) {
        var expr = "(function "+name+"("+args+"){"+flatten(source)+"})";
        // console.log("compiling: "+expr);
        return eval(expr);
    }

    function ifelse(c,t,f) {
        return ["if(",c,") {",t,"} else {", f, "}"];
    }

    return function(n) {
        function rep(fn) {
            var r = [];
            for (var i=0 ; i<n ; ++i) {
                r.push(fn(i));
            }
            return r;
        }

        var epsilon = 1e-12;
        var xyzw = ["x","y","z","w"].slice(0, n);

        function scalarOp(name, op) {
            return compile(
                name, "r,a,s",
                ifelse(
                    "'number'===typeof s",
                    ifelse(
                        "r===a",
                        rep(function(i) { return "r["+i+"]"+op+"=s;"; }),
                        rep(function(i) { return "r["+i+"]=a["+i+"]"+op+"s;"; })),
                    rep(function(i) { return "r["+i+"]=a["+i+"]"+op+"s["+i+"];"; })));
        }

        function dot(a,b) {
            return rep(function(i) { return a+"["+i+"]*"+b+"["+i+"]"; }).join("+");
        }

        function coeff(name, comp) {
            var impl = [
                "var i = a[0] "+comp+" a[1] ? 0 : 1;"
            ];

            for (var i=2 ; i+1 < n ; ++i) {
                impl.push("if (a["+i+"] "+comp+" a[i]) i="+i+";");
            }

            impl.push("return a["+i+"] "+comp+" a[i] ? "+i+" : i;");

            return compile(name+"Coeff", "a", impl);
        }

        return {
            copy : compile("copy", "r,a", [
                rep(function(i) { return "r["+i+"]=a["+i+"];"; })
            ]),
            zero : compile("zero", "r", [
                rep(function(i) { return "r["+i+"]=0;"; })
            ]),
            fill : compile("fill", "r,v", [
                rep(function(i) { return "r["+i+"]=v;"; })
            ]),
            dot : compile("dot", "a,b", [
                "return "+dot("a","b")+";"
            ]),
            add : compile("mul", "r,a,b", [
                ifelse(
                    "r===b",
                    rep(function(i) { return "r["+i+"]+=a["+i+"];"; }),
                    ifelse(
                        "r===a",
                        rep(function(i) { return "r["+i+"]+=b["+i+"];"; }),
                        rep(function(i) { return "r["+i+"]=a["+i+"]+b["+i+"];"; })))
            ]),
            sub : compile("sub", "r,a,b", [
                ifelse(
                    "r===a",
                    rep(function(i) { return "r["+i+"]-=b["+i+"];" }),
                    rep(function(i) { return "r["+i+"]=a["+i+"]-b["+i+"];"; }))
            ]),
            dist2 : compile("dist2", "a,b", [
                rep(function(i) { return "var d"+i+" = a["+i+"] - b["+i+"];"; }),
                "return "+rep(function(i) { return "d"+i+"*d"+i; }).join(" + ")+";"
            ]),
            dist : compile("dist", "a,b", [
                rep(function(i) { return "var d"+i+" = a["+i+"] - b["+i+"];"; }),
                "return Math.sqrt("+rep(function(i) { return "d"+i+"*d"+i; }).join(" + ")+");"
            ]),
            distL1 : compile("distL1", "a,b", [
                "return "+rep(function(i) { return "Math.abs(a["+i+"]-b["+i+"])" }).join(" + ")+";"
            ]),
            distLinf : compile("distLinf", "a,b", [
                "return Math.max(" +
                    rep(function(i) { return "Math.abs(a["+i+"]-b["+i+"])"; }).join(", ") +
                    ");"
            ]),
            scale : scalarOp("scale", "*"),
            invScale : scalarOp("invScale", "/"),
            addScale : compile("addScale", "r,s,a,b", [
                rep(function(i) { return "r["+i+"] = s*a["+i+"] + b["+i+"];"; })
            ]),
            clamp : compile("clamp", "r,min,a,max", [
                rep(function(i) { return [
                    (!i?"var ":"")+"t = a["+i+"];",
                    "r["+i+"] = t < min ? min : (t > max : max : t);"
                ];});
            ]),
            // TODO: clampToMin, clampToMax
            interpolate : compile("interpolate", "r,a,b,t", [
                "var s = 1-t;",
                rep(function(i) { return "r["+i+"] = s*a["+i+"] + t*b["+i+"];"; })
            ]),
            normSquared : compile("normSquared", "a", [
                "return "+dot("a","a")+";"
            ]),
            norm : compile("norm", "a", [
                "return Math.sqrt("+dot("a","a")+");"
            ]),
            normalize : compile("normalize", "r,a", [
                "var s = Math.sqrt("+dot("a","a")+");",
                "if (s < "+epsilon+") return;", // throw?
                "s = 1/s;",
                rep(function(i) { return "r["+i+"]=a["+i+"]*s;"; })
            ]),
            angle : compile("angle", "a,b", [
                "var d = this.dot(a,b) / (this.norm(a) * this.norm(b));",
                "return d < -1 ? Math.PI : (d > 1 ? 0 : Math.acos(d));",
            ]),
            abs : compile("abs", "r,a", [
                rep(function(i) { return "r["+i+"]=Math.abs(a["+i+"]);"; })
            ]),
            set : compile("set", "r,"+xyzw, [
                rep(function(i) { return "r["+i+"]="+xyzw[i]+";"; })
            ]),
            negate : compile("negate", "r,a", [
                rep(function(i) { return "r["+i+"]=-a["+i+"];"; })
            ]),
            max : compile("max", "r,a,b", [
                rep(function(i) { return "r["+i+"]=Math.max(a["+i+"],b["+i+"]);"; })
            ]),
            min : compile("min", "r,a,b", [
                rep(function(i) { return "r["+i+"]=Math.min(a["+i+"],b["+i+"]);"; })
            ]),
            maxCoeff : coeff("max", ">"),
            minCoeff : coeff("min", "<"),
            string : compile("string", "a", [
                "return '['+Array.prototype.join.call(a)+']';"
            ])
        };
    };
});
