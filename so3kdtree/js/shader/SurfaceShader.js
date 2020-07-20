define(["gl/Shader"], function(Shader) {
    var vsSource = [
        "attribute vec3 position;",
        "attribute vec3 normal;",

        "uniform mat4 modelView;",
        "uniform mat4 projection;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 color;",

        "varying vec4 vColor;",
        "varying vec3 vNormal;",
        "varying vec3 vEyeDir;",

        "void main(void) {",
        "    vec4 viewPos = modelView * vec4(position, 1.0);",
        "    gl_Position = projection * viewPos;",
        "    vEyeDir = normalize(-viewPos.xyz);",
        "    vNormal = normalMatrix * normal;",
        "    vColor = vec4(color, 1.0);", //vec4(0.8,0.8,0.8,1);",
        "}"
    ];
    var fsSource = [
        "precision highp float;",

        "varying vec4 vColor;",
        "varying vec3 vNormal;",
        "varying vec3 vEyeDir;",

        "void main(void) {",
        "    float shininess = 9.0;",
        "    float specularLevel = 0.2;",
        "    vec3 specularColor = vec3(1.0, 1.0, 1.0);",

        "    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));",
        "    vec3 lightColor = vec3(0.8, 0.8, 0.8);",
        "    vec3 ambientLight = vec3(0.05, 0.05, 0.05);",

        "    vec4 color = vColor;",
        "    vec3 normal = normalize(vNormal);",
        "    vec3 eyeDir = normalize(vEyeDir);",
        "    vec3 reflectDir = reflect(-lightDir, normal);",

        "    float specularFactor = pow(clamp(dot(reflectDir, eyeDir), 0.0, 1.0), shininess) * specularLevel;",
        "    float lightFactor = max(dot(lightDir, normal), 0.0);",
        "    vec3 lightValue = ambientLight + (lightColor * lightFactor) + (specularColor * specularFactor);",
        "    gl_FragColor = vec4(color.rgb * lightValue, color.a);",
        "}"
    ];
    
    function SurfaceShader(gl) {
        this.init(gl, vsSource, fsSource);
    }

    SurfaceShader.prototype = new Shader();

    return SurfaceShader;
});
