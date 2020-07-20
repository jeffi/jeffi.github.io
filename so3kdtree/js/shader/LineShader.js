define(["gl/Shader"], function(Shader) {
    var vsSource = [
        "attribute vec3 position;",
        // "attribute vec4 color;",

        "uniform vec3 color;",
        "uniform mat4 modelView;",
        "uniform mat4 projection;",

        "varying vec3 vColor;",

        "void main(void) {",
        "    gl_Position = projection * modelView * vec4(position, 1.0);",
        "    vColor = color;",
        "}"
    ];

    var fsSource = [
        "precision highp float;",

        "varying vec3 vColor;",

        "void main(void) {",
        "    gl_FragColor = vec4(vColor, 1.0);",
        "}"
    ];

    function LineShader(gl) {
        this.init(gl, vsSource, fsSource);
    }

    LineShader.prototype = new Shader();

    return LineShader;
});
