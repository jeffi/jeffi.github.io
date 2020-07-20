define(function() {
    function PointCloud(gl, points) {
        var n = points.length;
        var array = new Float32Array(n*3);
        for (var i=0,j=0 ; i<n ; ++i) {
            var p = points[i];
            array[j++] = p[0];
            array[j++] = p[1];
            array[j++] = p[2];
        }

        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        this.positions = vBuf;
        this.count = n;
    }

    PointCloud.prototype = {
        draw : function (gl, shader) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
            gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, 0, this.count);
        }
    };

    return PointCloud;
});
