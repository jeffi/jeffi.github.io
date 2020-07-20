define(["math/v3"], function(v3) {
    function Sphere(gl, maxDepth, radius) {
        var i = [];
        var v = [];
        var n = [];
        var v3s = [];
        var tri = [];

        var ptNo = 0;
        var midPoints = {};

        function addPoint(x, y, z) {
            v3s.push(new Float64Array([x*radius, y*radius, z*radius]));
            v.push(x*radius, y*radius, z*radius);
            n.push(x, y, z);
            return ptNo++;
        }

        function midPoint(a, b) {
            var key = Math.min(a,b) + "," + Math.max(a,b);
            var mp = midPoints[key];
            if (!mp) {
                var x = n[a*3  ] + n[b*3  ];
                var y = n[a*3+1] + n[b*3+1];
                var z = n[a*3+2] + n[b*3+2];

                var s = Math.sqrt(x*x + y*y + z*z);

                midPoints[key] = mp = addPoint(x/s, y/s, z/s);
            }
            return mp;
        }

        function subdivide(a, b, c, d) {
            if (d++ > maxDepth) {
                i.push(a, b, c);
                tri.push([a,b,c]);
            } else {
                var ab = midPoint(a,b);
                var bc = midPoint(b,c);
                var ca = midPoint(c,a);
                subdivide(a, ab, ca, d);
                subdivide(b, bc, ab, d);
                subdivide(c, ca, bc, d);
                subdivide(ab, bc, ca, d);
            }
        }

        addPoint( 0, 0, 1);
        addPoint( 0, 1, 0);
        addPoint( 1, 0, 0);
        addPoint( 0, 0,-1);
        addPoint( 0,-1, 0);
        addPoint(-1, 0, 0);

        subdivide(0, 2, 1, 0);
        subdivide(0, 1, 5, 0);
        subdivide(0, 4, 2, 0);
        subdivide(0, 5, 4, 0);
        subdivide(3, 1, 2, 0);
        subdivide(3, 5, 1, 0);
        subdivide(3, 2, 4, 0);
        subdivide(3, 4, 5, 0);
        
        var nBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);

        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

        var iBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.iArray = new Uint16Array(i), gl.STATIC_DRAW);

            // vertexCount : ptNo,
            // indexCount : i.length,
            // normalBuffer : n,
            // vertexBuffer : v,
            // indexBuffer : i

        this.indexCount = i.length;
        this.normals = nBuf;
        this.vertexes = vBuf;
        this.indexes = iBuf;

        this.mVerts = v3s;
        this.zVerts = new Float64Array(v3s.length);
        this.triangles = tri;
    }

    Sphere.prototype = {
        draw : function (gl, shader, mvp) {
            var mVerts = this.mVerts;
            var zVerts = this.zVerts;
            var triangles = this.triangles;
            var iArray = this.iArray;

            for (var i=0, n=mVerts.length ; i<n ; ++i) {
                zVerts[i] = v3.m4transformZ(mvp, mVerts[i]);
            }
            triangles.sort(function(a,b) {
                return (Math.min(zVerts[a[0]],
                                 zVerts[a[1]],
                                 zVerts[a[2]]) -
                        Math.min(zVerts[b[0]],
                                 zVerts[b[1]],
                                 zVerts[b[2]]));
            });
            for (var i=0, j=0, n=triangles.length ; i<n ; ++i) {
                var t = triangles[i];
                iArray[j++] = t[0];
                iArray[j++] = t[1];
                iArray[j++] = t[2];                
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes);
            gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
            gl.vertexAttribPointer(shader.attributes.normal, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexes);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iArray, gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        }
    };

    return Sphere;
});
