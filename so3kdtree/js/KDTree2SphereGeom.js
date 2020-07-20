define(["math/v3"], function(v3) {
    var arcEps = Math.cos(1 * Math.PI / 180);
    var faceEps = Math.cos(5 * Math.PI / 180);

    function midPoint(a, b) {
        var m = new Float64Array(3);
        v3.add(m, a, b);
        v3.normalize(m, m);
        return m;
    }

    function makeArc(gl, a, b) {
        var verts = [];

        function subdivide(v0, v1) {
            var dot = v3.dot(v0, v1); // [0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];

            if (dot > arcEps)
                return;

            var vm = midPoint(v0, v1);

            subdivide(v0, vm);
            verts.push.apply(verts, vm);
            subdivide(vm, v1);
        }

        verts.push.apply(verts, a);
        subdivide(a, b);
        verts.push.apply(verts, b);

        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        return {
            buffer : vBuf,
            nVerts : verts.length / 3
        };
    }

    function makeFace(gl, a, b, c, d) {
        // a  b
        // d  c

        var verts = [];
        var ptNo = 0;
        var ptMap = {};
        var indexes = [];

        function addPoint(v) {
            verts.push(v);
            return ptNo++;
        }

        function midPointIndex(a, b) {
            var key = Math.min(a,b)+":"+Math.max(a,b);
            var idx = ptMap[key];
            if ("undefined" === typeof idx) {
                idx = addPoint(midPoint(verts[a], verts[b]));
                ptMap[key] = idx;
            }
            return idx;
        }

        function absDot(a, b) {
            return Math.abs(v3.dot(verts[a], verts[b]));
        }

        function subdivide(a,b,c,d) {
            var dx = Math.min(absDot(a, b), absDot(c, d));
            var dy = Math.min(absDot(b, c), absDot(a, d));

            if (Math.min(dx, dy) > faceEps) {
                // add face
                var center = new Float32Array(3);
                v3.add(center, verts[a], verts[b]);
                v3.add(center, center, verts[c]);
                v3.add(center, center, verts[d]);
                v3.normalize(center, center);
                center = addPoint(center);
                indexes.push(a,b,center,
                             b,c,center,
                             c,d,center,
                             d,a,center);
            } else if (dx < dy) {
                var ab = midPointIndex(a, b);
                var dc = midPointIndex(d, c);
                subdivide(a, ab, dc, d);
                subdivide(ab, b, c, dc);
            } else {
                var bc = midPointIndex(b, c);
                var da = midPointIndex(d, a);
                subdivide(b, bc, da, a);
                subdivide(bc, c, d, da);
            }
        }

        subdivide(addPoint(a),
                  addPoint(b),
                  addPoint(c),
                  addPoint(d));

        var vArray = new Float32Array(verts.length * 3);
        for (var i=0,j=0 ; i<verts.length ; ++i) {
            var vert = verts[i];
            vArray[j++] = vert[0];
            vArray[j++] = vert[1];
            vArray[j++] = vert[2];
        }
        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, vArray, gl.STATIC_DRAW);

        var iBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);

        return {
            indexCount : indexes.length,
            vertexes : vBuf,
            indexes : iBuf
        };
    }

    function KDTree2SphereGeom(gl, kdtree) {
        var vols = [];

        for (var vol = 0 ; vol < 3 ; ++vol) {
            var xi = (vol + 1) % 3;
            var yi = (vol + 2) % 3;


            var v = 0.70710678118655;
            var min = [ v, v, v, v ];
            var max = [ v, v,-v,-v ];

            v = 0.57735026918963;

            var a = [v,v,v];
            var b = [v,v,v];
            var c = [v,v,v];
            var d = [v,v,v];

            b[yi] = -v;
            c[yi] = -v;
            c[xi] = -v;
            d[xi] = -v;

            var parts = [
                makeArc(gl, a, b),
                makeArc(gl, b, c),
                makeArc(gl, c, d),
                makeArc(gl, d, a)
            ];

            kdTreeDrawImpl(kdtree.volumes[vol], 0, min, max);
            vols.push(parts);
        }

        function makeFaceInBounds(min, max) {
            var a = new Float32Array(3);
            var b = new Float32Array(3);
            var c = new Float32Array(3);
            var d = new Float32Array(3);
            var i = (vol + 1) % 3;
            var j = 3 - vol - i;

            a[vol] = b[vol] = c[vol] = d[vol] = 1;
            a[i] = b[i] = -min[0] / min[2];
            c[i] = d[i] = -max[0] / max[2];
            a[j] = d[j] = -min[1] / min[3];
            b[j] = c[j] = -max[1] / max[3];

            v3.normalize(a, a);
            v3.normalize(b, b);
            v3.normalize(c, c);
            v3.normalize(d, d);

            return makeFace(gl, a, b, c, d);
        }

        function kdTreeDrawImpl(n, depth, min, max) {
            if (!n || n.point) { // leaf node
                n.face = makeFaceInBounds(min, max);
                return;
            }

            var y = -n.split[0] / n.split[1];
            var x = 1;
            var xi = 1 - n.axis;
            var z0 = -min[xi + 0] / min[xi + 2];
            var z1 = -max[xi + 0] / max[xi + 2];
            var yi = (vol + n.axis + 1) % 3;
            var zi = 3 - vol - yi;

            var v0 = new Array(3);
            var s = 1.0 / Math.sqrt(x*x + y*y + z0*z0);
            v0[vol] = x*s;
            v0[yi] = y*s;
            v0[zi] = z0*s;
            
            var v1 = new Array(3);
            var s = 1.0 / Math.sqrt(x*x + y*y + z1*z1);
            v1[vol] = x*s;
            v1[yi] = y*s;
            v1[zi] = z1*s;

            parts.push(makeArc(gl, v0, v1));

            ++depth;

            if (n.left) {
                var lMin = min.slice();
                lMin[n.axis + 0] = n.split[0];
                lMin[n.axis + 2] = n.split[1];
                kdTreeDrawImpl(n.left, depth, lMin, max);
            }
            if (n.right) {
                var rMax = max.slice();
                rMax[n.axis + 0] = n.split[0];
                rMax[n.axis + 2] = n.split[1];
                kdTreeDrawImpl(n.right, depth, min, rMax);
            }
        }

        this.kdtree = kdtree;
        this.vols = vols;
    }

    KDTree2SphereGeom.prototype = {
        draw : function (gl, shader, options) {
            var vols = this.vols;
            options = options || {};
            (options.volumes || [0,1,2]).forEach(function(vol) {
                vols[vol].forEach(function(split) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, split.buffer);
                    gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);
                    gl.drawArrays(gl.LINE_STRIP, 0, split.nVerts);
                });
            });

            if (options.borders) {
                options.borders.forEach(function(vol) {
                    for (var i=0 ; i<4 ; ++i) {
                        var split = vols[vol][i];
                        gl.bindBuffer(gl.ARRAY_BUFFER, split.buffer);
                        gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);
                        gl.drawArrays(gl.LINE_STRIP, 0, split.nVerts);                    
                    }
                });
            }
        },
        drawSearch : function (gl, shader, pt) {
            this.kdtree.nearest(pt, function(n) {
                var face = n.face;

                gl.bindBuffer(gl.ARRAY_BUFFER, face.vertexes);
                gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);
                gl.vertexAttribPointer(shader.attributes.normal, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, face.indexes)
                gl.drawElements(gl.TRIANGLES, face.indexCount, gl.UNSIGNED_SHORT, 0);
            });
        }
    };

    return KDTree2SphereGeom;
});
