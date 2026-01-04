const canvas = document.getElementById('shader-bg');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
}

// WebGL Shader Logic - Particle Galaxy
// Resize canvas to fill screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Vertex Shader (Simple Pass-through)
const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// Fragment Shader (Particle Galaxy)
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    #define iterations 17
    #define formuparam 0.53
    #define volsteps 20
    #define stepsize 0.1
    
    #define zoom   0.800
    #define tile   0.850
    #define speed  0.010 
    
    #define brightness 0.0015
    #define darkmatter 0.300
    #define distfading 0.730
    #define saturation 0.850

    void main() {
        // Pixel coordinates centered at (0,0)
        vec2 uv = gl_FragCoord.xy / u_resolution.xy - 0.5;
        uv.y *= u_resolution.y / u_resolution.x;
        
        // Mouse influence
        vec2 mouse = (u_mouse / u_resolution.xy - 0.5) * 2.0;

        vec3 dir = vec3(uv * zoom, 1.0);
        float time = u_time * speed + 0.25;

        // Rotation
        float a1 = 0.5 + mouse.x * 0.5; // Mouse X influence
        float a2 = 0.8 + mouse.y * 0.5; // Mouse Y influence
        mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
        mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
        
        dir.xz *= rot1;
        dir.xy *= rot2;
        
        vec3 from = vec3(1.0, 0.5, 0.5);
        from += vec3(time * 2.0, time, -2.0);
        from.xz *= rot1;
        from.xy *= rot2;
        
        // Volumetric Rendering
        float s = 0.1, fade = 1.0;
        vec3 v = vec3(0.0);
        
        for (int r = 0; r < volsteps; r++) {
            vec3 p = from + s * dir * 0.5;
            p = abs(vec3(tile) - mod(p, vec3(tile * 2.0))); // Tiling fold
            
            float pa, a = pa = 0.0;
            for (int i = 0; i < iterations; i++) { 
                p = abs(p) / dot(p, p) - formuparam; // The Fractal Formula
                a += abs(length(p) - pa); // Absolute sum of average change
                pa = length(p);
            }
            
            float dm = max(0.0, darkmatter - a * a * 0.001); // Dark matter
            a *= a * a; // Contrast
            if (r > 6) fade *= 1.0 - dm; // Dark matter, don't render near
            
            // DEEP VIOLET GALAXY COLORING
            v += vec3(s * s * s, s * s, s) * a * brightness * fade; // Base color structure
            
            fade *= distfading; // Distance fading
            s += stepsize;
        }
        
        // Color Correction for Violet Theme
        v = mix(vec3(length(v)), v, saturation); // Color adjust
        

        // Remap to Indigo/Pink Palette
        vec3 color = v * 0.01;
        color.r *= 1.8; // Pink influence
        color.g *= 1.3; // Soften
        color.b *= 2.0; // Deep Indigo base
        
        // Add soft pink core
        color += vec3(v.r * 0.015, v.g * 0.012, v.b * 0.015);
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Set up rectangle covering the canvas
const positionLocation = gl.getAttribLocation(program, "position");
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0,
]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const uResolution = gl.getUniformLocation(program, "u_resolution");
const uTime = gl.getUniformLocation(program, "u_time");
const uMouse = gl.getUniformLocation(program, "u_mouse");

// let mouseX = 0, mouseY = 0;
// document.addEventListener('mousemove', (e) => {
//     mouseX = e.clientX;
//     mouseY = e.clientY;
// });

function render(time) {
    time *= 0.001; // convert to seconds

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, 0.0, 0.0); // Mouse influence disabled

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
