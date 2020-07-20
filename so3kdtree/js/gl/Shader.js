define(function() {
    function compileShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var err = gl.getShaderInfoLog(shader);
            console.error("shader compile failed: ", err);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function Shader() {
    }

    var attribTypeMap = {
        // FLOAT_VEC3
        0x8B51 : function(gl, name, loc) {
            return function() {
            };
        },

        // FLOAT_VEC4
        0x8B52 : function(gl, name, loc) {
            return function() {
            }
        }
    };

    function upcaseFirst(str) {
        return str.substr(0,1).toUpperCase() + str.substr(1);
    }

    function bindAttribute(shader, gl, program, attr) {
        var loc = gl.getAttribLocation(program, attr.name);
        var baseName = upcaseFirst(attr.name);

        switch (attr.type) {
        case gl.FLOAT_VEC3:
            // setPositionArray(buf)
            shader["set" + baseName + "Array"] = function(buf, type, normalized) {
                if ("undefined" === typeof normalized) {
                    normalized = false;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.vertexAttribPointer(loc, 3, type||gl.FLOAT, normalized, 3, 0);
            };
            break;

        case gl.FLOAT_VEC4:
            shader["set" + baseName + "Array"] = function(buf, type, normalized) {
                if ("undefined" === typeof normalized) {
                    normalized = false;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.vertexAttribPointer(loc, 4, type||gl.UNSIGNED_BYTE, normalized, 4, 0);
            };
            break;
        }
    }

    function bindUniform(shader, gl, program, uniform) {
        var loc = gl.getUniformLocation(program, uniform.name);
        var baseName = upcaseFirst(uniform.name);

        switch (uniform.type) {
        case gl.FLOAT_MAT4:
            shader["set" + baseName + "Matrix4fv"] = function (m4) {
                gl.uniformMatrix4fv(loc, false, m4);
            };
        }
    }

    Shader.prototype = {
        init : function (gl, vsSource, fsSource, uniforms) {
            var program = gl.createProgram();
            var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource.join("\n"));
            var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource.join("\n"));

            var success = vertexShader && fragmentShader;

            if (success) {
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);

                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.error("failed to link shader program");
                    success = false;
                }
            }

            if (!success) {
                gl.deleteProgram(program);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                return;
            }

            this.program = program;

            var attribs = {};
            for (var i=0, n=gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) ; i<n ; ++i) {
                var a = gl.getActiveAttrib(program, i);
                attribs[a.name] = gl.getAttribLocation(program, a.name);
                // bindAttribute(this, gl, program, gl.getActiveAttrib(program, i));
            }

            var uniforms = {};
            for (var i=0, n=gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) ; i<n ; ++i) {
                var u = gl.getActiveUniform(program, i);
                uniforms[u.name] = gl.getUniformLocation(program, u.name);
                // bindUniform(this, gl, program, gl.getActiveUniform(program, i));
            }

            this.attributes = attribs;
            this.uniforms = uniforms;
        }        
    };

    return Shader;
});
