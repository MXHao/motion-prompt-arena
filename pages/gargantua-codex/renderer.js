"use strict";

(() => {
  const QUAD = `#version 330
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
  const SHADOW_VERTEX = `#version 330
layout(location=0) in vec3 packedPoint;
uniform mat3 transform;
void main() { gl_Position = vec4(transform * (packedPoint * 4.5), 1.0); }`;
  const SHADOW_FRAGMENT = "#version 330\nvoid main() {}";
  const BRIGHT = `#version 330
uniform sampler2D exposure;
uniform float radianceScale;
in vec2 uv;
out vec4 fragment;
void main() {
  vec3 col = texture(exposure, uv).rgb;
  float peak = max(col.r, max(col.g, col.b)) / radianceScale;
  fragment = vec4(col * smoothstep(0.18, 1.22, peak), 1.0);
}`;

  const MODES = {
    flyby: { yaw: 0.13, pitch: 0.128, bank: -0.30, radius: 28.2, min: 0.52, max: 2.25 },
    ship: { yaw: 0.23, pitch: 0.21, bank: -0.07, radius: 22.8, min: 0.43, max: 2.85 },
    hole: { yaw: 0.72, pitch: 0.117, bank: -0.21, radius: 38.8, min: 0.50, max: 1.99 },
  };
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cross = (a, b) => [
    a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0],
  ];
  const scale = (v, s) => v.map(value => value * s);
  const add = (a, b) => a.map((value, i) => value + b[i]);
  const unit = v => scale(v, 1 / Math.hypot(...v));
  const asMatrix = columns => new Float32Array(columns.flat());

  function fromView(basis, point) {
    return add(add(scale(basis[0], point[0]), scale(basis[1], point[1])), scale(basis[2], point[2]));
  }

  function intoView(basis, point) {
    return basis.map(axis => dot(axis, point));
  }

  function cameraBasis(yaw, pitch, bank) {
    const radial = [Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), Math.cos(yaw)*Math.cos(pitch)];
    const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const up = cross(radial, right);
    const c = Math.cos(bank), s = Math.sin(bank);
    return [add(scale(right, c), scale(up, s)), add(scale(up, c), scale(right, -s)), radial];
  }

  function shipBasis(seconds) {
    const yaw = -0.44, pitch = -0.23, spin = -1.45 - 0.21*seconds;
    const c = Math.cos(spin), s = Math.sin(spin);
    const a = Math.cos(yaw), b = Math.sin(yaw);
    const p = Math.cos(pitch), q = Math.sin(pitch);
    const tilted = [[a, 0, -b], [b*q, p, a*q], [b*p, -q, a*p]];
    return [
      fromView(START, add(scale(tilted[0], c), scale(tilted[1], s))),
      fromView(START, add(scale(tilted[1], c), scale(tilted[0], -s))),
      fromView(START, tilted[2]),
    ];
  }

  const START = cameraBasis(MODES.flyby.yaw, MODES.flyby.pitch, MODES.flyby.bank);
  const SHIP_CENTER = fromView(START, [-8.50, 0.85, MODES.flyby.radius - 17.7]);
  const KEY_LIGHT = fromView(START, unit([0.84, -0.42, 0.24]));

  function view(mode, camera, aspect, seconds) {
    const config = MODES[mode];
    const basis = cameraBasis(camera.yaw, camera.pitch, config.bank);
    const radius = config.radius / (mode === "flyby" ? 1 : camera.zoom);
    const eye = scale(basis[2], radius);
    const center = [camera.x, camera.y];
    let focal;
    let shipPosition;
    let shipScale = 1;
    if (mode === "flyby") {
      center[0] += 0.223 * aspect;
      center[1] += 0.056;
      focal = 2.27 * Math.min(1, aspect/2.08) * camera.zoom;
      shipPosition = intoView(basis, add(SHIP_CENTER, scale(eye, -1)));
      shipScale = 0.566;
    } else if (mode === "ship") {
      focal = 2.11 * Math.min(1, aspect/0.92);
      shipPosition = [0, 0, -radius];
    } else {
      focal = 2.22 * Math.min(1, aspect/1.02);
    }
    const orientation = shipPosition && shipBasis(seconds).map(axis => scale(intoView(basis, axis), shipScale));
    return { aspect, basis, eye, center, focal, shipPosition, shipScale, orientation };
  }

  function projection({ focal, aspect, center }) {
    const near = 2.1, far = 190;
    return new Float32Array([
      2*focal/aspect, 0, 0, 0,
      0, 2*focal, 0, 0,
      -2*center[0]/aspect, -2*center[1], -(far+near)/(far-near), -1,
      0, 0, -2*far*near/(far-near), 0,
    ]);
  }

  function modelView(axes, point) {
    return new Float32Array([...axes[0], 0, ...axes[1], 0, ...axes[2], 0, ...point, 1]);
  }

  function linearLightTransform(key, size) {
    const side = unit(cross(Math.abs(key[1]) < 0.94 ? [0, 1, 0] : [0, 0, 1], key));
    const up = cross(key, side);
    return [scale(side, 1/(4.7*size)), scale(up, 1/(4.7*size)), scale(key, -1/(6.4*size))];
  }

  function glsl(source) {
    return source.replace(/^#version 330\s*/, "#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2DShadow;\n");
  }

  function program(gl, shaders, uniforms) {
    const compiled = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map((type, i) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, glsl(shaders[i]));
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    });
    const handle = gl.createProgram();
    compiled.forEach(shader => gl.attachShader(handle, shader));
    gl.linkProgram(handle);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(handle));
    compiled.forEach(shader => gl.deleteShader(shader));
    return {
      handle,
      loc: Object.fromEntries(uniforms.map(name => [name, gl.getUniformLocation(handle, name)])),
    };
  }

  function decoded(base64) {
    const bytes = atob(base64);
    const output = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) output[i] = bytes.charCodeAt(i);
    return output;
  }

  function texture(gl, filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE) {
    const result = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, result);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return result;
  }

  function starTexture(gl) {
    const width = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE)), height = width / 2;
    const pixels = new Uint8Array(width * height * 3);
    let seed = 91837;
    function random() {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    }
    for (let i = 0; i < 14500; i += 1) {
      const x = random()*width;
      const y = (Math.asin(random()*2-1)/Math.PI+0.5)*(height-1);
      const brightness = random() ** 5;
      const sigma = 0.34 + brightness*0.23;
      const energy = 8 + brightness*156;
      const tint = random();
      for (let dy = -1; dy <= 2; dy += 1) {
        for (let dx = -1; dx <= 2; dx += 1) {
          const ix = Math.floor(x) + dx, iy = Math.floor(y) + dy;
          if (iy < 0 || iy >= height) continue;
          const weight = energy * Math.exp(-((x-ix)**2+(y-iy)**2)/(2*sigma*sigma));
          const address = (iy*width+(ix+width)%width)*3;
          pixels[address] = Math.min(255, pixels[address] + weight*(1.0-0.37*tint));
          pixels[address+1] = Math.min(255, pixels[address+1] + weight*(0.75+0.10*tint));
          pixels[address+2] = Math.min(255, pixels[address+2] + weight*(0.48+0.52*tint));
        }
      }
    }
    const stars = texture(gl, gl.LINEAR_MIPMAP_LINEAR, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    return stars;
  }

  function requireComplete(gl, label) {
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(label + " framebuffer is incomplete");
    }
  }

  class Scene {
    constructor(canvas, assets, letteringImage) {
      this.canvas = canvas;
      const gl = this.gl = canvas.getContext("webgl2", {
        antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance",
      });
      if (!gl) throw new Error("WebGL 2 unavailable");
      this.hdr = Boolean(gl.getExtension("EXT_color_buffer_float"));
      this.radianceScale = this.hdr ? 1 : 0.165;
      this.colorFormat = this.hdr ? gl.RGBA16F : gl.RGBA8;
      const colorSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, this.colorFormat, gl.SAMPLES);
      const depthSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, gl.SAMPLES);
      this.samples = [4, 2].find(n => colorSamples.includes(n) && depthSamples.includes(n)) || 0;
      this.width = this.height = 0;
      gl.depthFunc(gl.LEQUAL);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      this.setupPrograms(assets.shaders);
      this.setupGeometry(assets);

      this.starMap = starTexture(gl);
      this.stencil = texture(gl, gl.LINEAR_MIPMAP_LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, letteringImage);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.createShadowTarget();
      this.quad = gl.createVertexArray();
    }

    setupPrograms(shaders) {
      const gl = this.gl;
      const space = shaders.space
        .replace("out vec4 fragment;", "uniform int shipView;\nuniform float radianceScale;\nout vec4 fragment;")
        .replace("vec3 col = trace(ray);", `vec3 col;
          if (shipView == 1) {
              col = sky(ray) + vec3(0.0008, 0.0016, 0.0027) * exp(-4.0*dot(p, p));
          } else {
              col = trace(ray);
          }`)
        .replace("vec4(col, 1.0)", "vec4(col * radianceScale, 1.0)");
      const shipVertex = shaders.shipVertex
        .replace("in vec3 point;", "in vec3 packedPoint;\n#define point (packedPoint * 4.5)")
        .replace("material = parameters;", "material = vec3(parameters.xy, parameters.z * 16.0);");
      const shipFragment = shaders.shipFragment
        .replace("out vec4 fragment;", "uniform float radianceScale;\nuniform float inspectFill;\nuniform float holeEye;\nout vec4 fragment;")
        .replace("0.00085 + 0.0009", "0.0018 + 0.0032")
        .replace("void main() {", `void main() {
          if (holeEye > 0.0 && -position.z > holeEye) {
              float impact = length(position.xy)/length(position) * holeEye/sqrt(1.0 - 2.0/holeEye);
              if (impact < 5.1961524) discard;
          }`)
        .replace("fragment = vec4(ambient + warm + reflected + blue + emission, 1.0);",
          `vec3 fill = base * vec3(0.21, 0.27, 0.37) * inspectFill
                      * (0.34 + 0.66 * max(0.0, dot(n, normalize(vec3(0.31, 0.58, 0.79)))));
           fragment = vec4((ambient + warm + reflected + blue + emission + fill)*radianceScale, 1.0);`);
      const exhaustFragment = shaders.exhaustFragment
        .replace("out vec4 fragment;", "uniform float radianceScale;\nout vec4 fragment;")
        .replace("glow * throttle * pulse * falloff", "glow * throttle * pulse * falloff * radianceScale");
      const exhaustVertex = shaders.exhaustVertex
        .replace("uniform mat4 modelView;", "uniform mat4 modelView;\nuniform float holeEye;")
        .replace("uv = p;", `if (holeEye > 0.0 && -center.z > holeEye) {
          float impact = length(center.xy)/length(center.xyz) * holeEye/sqrt(1.0 - 2.0/holeEye);
          if (impact < 5.1961524) angleFade = 0.0;
        }
        uv = p;`);
      const grade = shaders.grade
        .replace("out vec4 fragment;", "uniform float radianceScale;\nout vec4 fragment;")
        .replace("float luma = dot(linear,", "linear /= radianceScale;\n    float luma = dot(linear,");
      this.programs = {
        space: program(gl, [QUAD, space], [
          "resolution", "observer", "camera", "focal", "holePosition", "seconds", "moon", "stars",
          "shipView", "radianceScale",
        ]),
        ship: program(gl, [shipVertex, shipFragment], [
          "projection", "modelView", "lightTransform", "key", "bounce", "throttle", "shadow",
          "stencil", "radianceScale", "inspectFill", "holeEye",
        ]),
        depth: program(gl, [SHADOW_VERTEX, SHADOW_FRAGMENT], ["transform"]),
        exhaust: program(gl, [exhaustVertex, exhaustFragment], [
          "projection", "modelView", "throttle", "seconds", "radianceScale", "holeEye",
        ]),
        bright: program(gl, [QUAD, BRIGHT], ["exposure", "radianceScale"]),
        grade: program(gl, [QUAD, grade], ["exposure", "glare", "resolution", "frame", "fade", "radianceScale"]),
      };
    }

    setupGeometry(assets) {
      const gl = this.gl;
      this.shipMesh = gl.createVertexArray();
      this.indexCount = assets.indexCount;
      this.indexType = assets.indexBytes === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
      gl.bindVertexArray(this.shipMesh);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, decoded(assets.vertices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, decoded(assets.indices), gl.STATIC_DRAW);
      const layout = [[3, gl.SHORT, 0], [3, gl.SHORT, 6], [3, gl.UNSIGNED_BYTE, 12],
        [3, gl.UNSIGNED_BYTE, 15], [2, gl.SHORT, 18]];
      layout.forEach(([size, type, offset], slot) => {
        gl.enableVertexAttribArray(slot);
        gl.vertexAttribPointer(slot, size, type, true, assets.stride, offset);
      });
      this.glowMesh = gl.createVertexArray();
      gl.bindVertexArray(this.glowMesh);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, decoded(assets.exhausts), gl.STATIC_DRAW);
      const nozzle = gl.getAttribLocation(this.programs.exhaust.handle, "nozzle");
      gl.enableVertexAttribArray(nozzle);
      gl.vertexAttribPointer(nozzle, 4, gl.FLOAT, false, 16, 0);
      gl.vertexAttribDivisor(nozzle, 1);
      this.exhaustCount = assets.exhaustCount;
      gl.bindVertexArray(null);
    }

    createShadowTarget() {
      const gl = this.gl;
      this.shadowSize = 1536;
      this.shadowMap = texture(gl);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.shadowSize, this.shadowSize, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      this.shadowBuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowMap, 0);
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
      requireComplete(gl, "Shadow");
    }

    resize(width, height) {
      if (this.width === width && this.height === height) return;
      const gl = this.gl;
      if (this.width) {
        gl.deleteFramebuffer(this.sceneBuffer);
        if (this.samples) {
          gl.deleteFramebuffer(this.resolvedBuffer);
          gl.deleteRenderbuffer(this.colorStorage);
        }
        gl.deleteFramebuffer(this.glareBuffer);
        gl.deleteRenderbuffer(this.depthStorage);
        gl.deleteTexture(this.sceneTexture);
        gl.deleteTexture(this.glareTexture);
      }
      this.canvas.width = this.width = width;
      this.canvas.height = this.height = height;

      this.sceneTexture = texture(gl);
      gl.texStorage2D(gl.TEXTURE_2D, 1, this.colorFormat, width, height);
      this.resolvedBuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.resolvedBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTexture, 0);
      this.sceneBuffer = this.resolvedBuffer;
      if (this.samples) {
        requireComplete(gl, "Resolve");
        this.sceneBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneBuffer);
        this.colorStorage = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.colorStorage);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, this.colorFormat, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.colorStorage);
      }
      this.depthStorage = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthStorage);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, width, height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthStorage);
      requireComplete(gl, "Scene");

      this.glareWidth = Math.max(1, Math.floor(width/2));
      this.glareHeight = Math.max(1, Math.floor(height/2));
      const levels = Math.min(8, 1+Math.floor(Math.log2(Math.min(this.glareWidth, this.glareHeight))));
      this.glareTexture = texture(gl, gl.LINEAR_MIPMAP_LINEAR);
      gl.texStorage2D(gl.TEXTURE_2D, levels, this.colorFormat, this.glareWidth, this.glareHeight);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels-1);
      this.glareBuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.glareBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.glareTexture, 0);
      requireComplete(gl, "Glare");
    }

    bind(textureHandle, unit, uniform) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, textureHandle);
      gl.uniform1i(uniform, unit);
    }

    use(name) {
      const { handle, loc } = this.programs[name];
      this.gl.useProgram(handle);
      return loc;
    }

    triangles(mesh) {
      const gl = this.gl;
      gl.bindVertexArray(mesh);
      gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
    }

    fullQuad() {
      const gl = this.gl;
      gl.bindVertexArray(this.quad);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    render(mode, camera, seconds) {
      const gl = this.gl;
      const { width, height } = this;
      const frame = view(mode, camera, width/height, seconds);
      const drawShip = frame.shipPosition && frame.shipPosition[2] < -0.8;
      const key = intoView(frame.basis, KEY_LIGHT);
      const clip = drawShip && projection(frame);
      const model = drawShip && modelView(frame.orientation, frame.shipPosition);
      const light = drawShip && linearLightTransform(key, frame.shipScale);
      if (drawShip) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowBuffer);
        gl.viewport(0, 0, this.shadowSize, this.shadowSize);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix3fv(this.use("depth").transform, false,
          asMatrix(frame.orientation.map(axis => light.map(row => dot(row, axis)))));
        this.triangles(this.shipMesh);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneBuffer);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      const space = this.use("space");
      this.bind(this.starMap, 0, space.stars);
      gl.uniform2f(space.resolution, width, height);
      gl.uniform3fv(space.observer, frame.eye);
      gl.uniformMatrix3fv(space.camera, false, asMatrix(frame.basis));
      gl.uniform1f(space.focal, frame.focal);
      gl.uniform2fv(space.holePosition, frame.center);
      gl.uniform1f(space.seconds, seconds + 8.3);
      gl.uniform3f(space.moon, 0, 0, 0);
      gl.uniform1i(space.shipView, mode === "ship" ? 1 : 0);
      gl.uniform1f(space.radianceScale, this.radianceScale);
      this.fullQuad();

      if (drawShip) {
        const holeEye = mode === "flyby" ? Math.hypot(...frame.eye) : 0;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const ship = this.use("ship");
        this.bind(this.shadowMap, 0, ship.shadow);
        this.bind(this.stencil, 1, ship.stencil);
        gl.uniformMatrix4fv(ship.projection, false, clip);
        gl.uniformMatrix4fv(ship.modelView, false, model);
        gl.uniformMatrix3fv(ship.lightTransform, false, asMatrix(light[0].map((_, i) => light.map(row => row[i]))));
        gl.uniform3fv(ship.key, key);
        gl.uniform3fv(ship.bounce, unit([0.47*key[0], -0.82, 0.42]));
        gl.uniform1f(ship.throttle, 0.81);
        gl.uniform1f(ship.inspectFill, mode === "ship" ? 1 : 0.14);
        gl.uniform1f(ship.holeEye, holeEye);
        gl.uniform1f(ship.radianceScale, this.radianceScale);
        this.triangles(this.shipMesh);

        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        const exhaust = this.use("exhaust");
        gl.uniformMatrix4fv(exhaust.projection, false, clip);
        gl.uniformMatrix4fv(exhaust.modelView, false, model);
        gl.uniform1f(exhaust.throttle, 0.84);
        gl.uniform1f(exhaust.seconds, seconds);
        gl.uniform1f(exhaust.radianceScale, this.radianceScale);
        gl.uniform1f(exhaust.holeEye, holeEye);
        gl.bindVertexArray(this.glowMesh);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.exhaustCount);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.disable(gl.DEPTH_TEST);
      }

      if (this.samples) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.sceneBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resolvedBuffer);
        gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.glareBuffer);
      gl.viewport(0, 0, this.glareWidth, this.glareHeight);
      const bright = this.use("bright");
      this.bind(this.sceneTexture, 0, bright.exposure);
      gl.uniform1f(bright.radianceScale, this.radianceScale);
      this.fullQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      const grade = this.use("grade");
      this.bind(this.glareTexture, 1, grade.glare);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.bind(this.sceneTexture, 0, grade.exposure);
      gl.uniform2f(grade.resolution, width, height);
      gl.uniform1f(grade.frame, Math.floor(seconds*24));
      gl.uniform1f(grade.fade, 1);
      gl.uniform1f(grade.radianceScale, this.radianceScale);
      this.fullQuad();
    }
  }

  window.enduranceRenderer = { Scene, MODES };
})();
