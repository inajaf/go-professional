/* gopher3d.js - self-contained GLB viewer for the dancing gopher hero mascot.
   Zero-dependency by design (see AGENTS.md): a minimal glTF-Binary parser and
   raw-WebGL skinned-mesh renderer, sized to the one asset this site ships
   (js/gopher3d.data.js -> window.GOPHER_GLB_B64). No fetch/XHR so it works
   over file://. Public API: window.GOPHER3D.mount(canvas). */
(function () {
  "use strict";

  /* ------------------------------------------------ base64 -> bytes */
  function b64ToBytes(b64) {
    var bin = atob(b64), n = bin.length, out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ------------------------------------------------ GLB container */
  function parseGLB(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("not a GLB");
    var len = dv.getUint32(8, true), off = 12, json = null, bin = null;
    while (off < len) {
      var chunkLen = dv.getUint32(off, true), chunkType = dv.getUint32(off + 4, true);
      var chunk = bytes.subarray(off + 8, off + 8 + chunkLen);
      if (chunkType === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk));
      else if (chunkType === 0x004e4942) bin = chunk;
      off += 8 + chunkLen + (chunkLen % 4 ? 4 - (chunkLen % 4) : 0);
    }
    return { json: json, bin: bin };
  }

  var COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  var SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

  // Typed-array view over an accessor. Interleaved buffers get compacted.
  function accessorData(gltf, bin, idx) {
    var acc = gltf.accessors[idx], bv = gltf.bufferViews[acc.bufferView];
    var T = COMP[acc.componentType], per = SIZE[acc.type];
    var start = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    var stride = bv.byteStride || 0, tight = per * T.BYTES_PER_ELEMENT;
    if (!stride || stride === tight) {
      return new T(bin.buffer, bin.byteOffset + start, acc.count * per);
    }
    var out = new T(acc.count * per);
    for (var i = 0; i < acc.count; i++) {
      var src = new T(bin.buffer, bin.byteOffset + start + i * stride, per);
      out.set(src, i * per);
    }
    return out;
  }

  /* ------------------------------------------------ mat4 / quat math */
  function m4ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function m4mul(a, b, out) {
    out = out || new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return out;
  }
  function m4fromTRS(t, q, s, out) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x, y2 = y + y, z2 = z + z;
    var xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = (1 - (yy + zz)) * s[0]; out[1] = (xy + wz) * s[0]; out[2] = (xz - wy) * s[0]; out[3] = 0;
    out[4] = (xy - wz) * s[1]; out[5] = (1 - (xx + zz)) * s[1]; out[6] = (yz + wx) * s[1]; out[7] = 0;
    out[8] = (xz + wy) * s[2]; out[9] = (yz - wx) * s[2]; out[10] = (1 - (xx + yy)) * s[2]; out[11] = 0;
    out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
    return out;
  }
  function m4perspective(fovY, aspect, near, far) {
    var f = 1 / Math.tan(fovY / 2), out = new Float32Array(16);
    out[0] = f / aspect; out[5] = f;
    out[10] = (far + near) / (near - far); out[11] = -1;
    out[14] = 2 * far * near / (near - far);
    return out;
  }
  function m4lookAt(eye, center, up) {
    var zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    var zl = Math.hypot(zx, zy, zz); zx /= zl; zy /= zl; zz /= zl;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    var xl = Math.hypot(xx, xy, xz); xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1
    ]);
  }
  function m4rotY(rad) {
    var c = Math.cos(rad), s = Math.sin(rad), m = m4ident();
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    return m;
  }
  function slerp(a, ai, b, bi, t, out) {
    var ax = a[ai], ay = a[ai + 1], az = a[ai + 2], aw = a[ai + 3];
    var bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];
    var dot = ax * bx + ay * by + az * bz + aw * bw;
    if (dot < 0) { bx = -bx; by = -by; bz = -bz; bw = -bw; dot = -dot; }
    var s0, s1;
    if (dot > 0.9995) { s0 = 1 - t; s1 = t; }
    else {
      var th = Math.acos(dot), sth = Math.sin(th);
      s0 = Math.sin((1 - t) * th) / sth; s1 = Math.sin(t * th) / sth;
    }
    out[0] = s0 * ax + s1 * bx; out[1] = s0 * ay + s1 * by;
    out[2] = s0 * az + s1 * bz; out[3] = s0 * aw + s1 * bw;
    return out;
  }

  /* ------------------------------------------------ scene from glTF */
  // The dance clips are authored for slim humanoids; on the gopher's chubby
  // body the full-strength arm poses bury the stubby arms inside the torso
  // and the spine bends read as squash. Per-joint damping blends each joint
  // back toward its rest (A-pose) rotation: arms mostly stay out to the
  // sides, the torso keeps a hint of groove, legs and hips dance at full.
  function dampFor(name) {
    if (/Shoulder|Arm|Hand/.test(name || "")) return 0.35;
    if (/Spine|neck/.test(name || "")) return 0.7;
    if (/Hips/.test(name || "")) return 0.85;
    return 1;
  }
  function buildScene(gltf, bin) {
    var nodes = (gltf.nodes || []).map(function (n) {
      return {
        t: n.translation ? n.translation.slice() : [0, 0, 0],
        r: n.rotation ? n.rotation.slice() : [0, 0, 0, 1],
        s: n.scale ? n.scale.slice() : [1, 1, 1],
        restT: n.translation ? n.translation.slice() : [0, 0, 0],
        restR: n.rotation ? n.rotation.slice() : [0, 0, 0, 1],
        restS: n.scale ? n.scale.slice() : [1, 1, 1],
        damp: dampFor(n.name),
        matrix: n.matrix ? new Float32Array(n.matrix) : null,
        children: n.children || [],
        mesh: n.mesh != null ? n.mesh : -1,
        skin: n.skin != null ? n.skin : -1,
        local: m4ident(), world: m4ident()
      };
    });

    var prims = [];
    (gltf.meshes || []).forEach(function (mesh, mi) {
      mesh.primitives.forEach(function (p) {
        prims.push({
          meshIndex: mi,
          pos: accessorData(gltf, bin, p.attributes.POSITION),
          nrm: p.attributes.NORMAL != null ? accessorData(gltf, bin, p.attributes.NORMAL) : null,
          uv: p.attributes.TEXCOORD_0 != null ? accessorData(gltf, bin, p.attributes.TEXCOORD_0) : null,
          joints: p.attributes.JOINTS_0 != null ? accessorData(gltf, bin, p.attributes.JOINTS_0) : null,
          weights: p.attributes.WEIGHTS_0 != null ? accessorData(gltf, bin, p.attributes.WEIGHTS_0) : null,
          idx: p.indices != null ? accessorData(gltf, bin, p.indices) : null,
          material: p.material != null ? p.material : -1,
          posMin: gltf.accessors[p.attributes.POSITION].min,
          posMax: gltf.accessors[p.attributes.POSITION].max
        });
      });
    });

    var skins = (gltf.skins || []).map(function (s) {
      return { joints: s.joints, ibm: accessorData(gltf, bin, s.inverseBindMatrices) };
    });

    var clips = (gltf.animations || []).map(function (a) {
      var duration = 0;
      var channels = a.channels.map(function (ch) {
        var sm = a.samplers[ch.sampler];
        var input = accessorData(gltf, bin, sm.input);
        var output = accessorData(gltf, bin, sm.output);
        if (input.length) duration = Math.max(duration, input[input.length - 1]);
        return { node: ch.target.node, path: ch.target.path, input: input, output: output, interp: sm.interpolation || "LINEAR" };
      });
      return { channels: channels, duration: duration };
    });

    // Base color texture bytes (first textured material wins; one-asset viewer).
    var texBytes = null, texMime = "image/png", baseColor = [1, 1, 1, 1];
    (gltf.materials || []).some(function (m) {
      var pbr = m.pbrMetallicRoughness || {};
      if (pbr.baseColorFactor) baseColor = pbr.baseColorFactor;
      if (pbr.baseColorTexture) {
        var tex = gltf.textures[pbr.baseColorTexture.index];
        var img = gltf.images[tex.source];
        var bv = gltf.bufferViews[img.bufferView];
        texBytes = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
        texMime = img.mimeType || "image/png";
        return true;
      }
      return false;
    });

    var sceneDef = gltf.scenes[gltf.scene || 0];
    return { nodes: nodes, roots: sceneDef.nodes, prims: prims, skins: skins, clips: clips, texBytes: texBytes, texMime: texMime, baseColor: baseColor };
  }

  function updateWorld(scene) {
    var nodes = scene.nodes;
    function walk(i, parent) {
      var n = nodes[i];
      if (n.matrix) n.local.set(n.matrix);
      else m4fromTRS(n.t, n.r, n.s, n.local);
      if (parent) m4mul(parent, n.local, n.world);
      else n.world.set(n.local);
      for (var c = 0; c < n.children.length; c++) walk(n.children[c], n.world);
    }
    for (var r = 0; r < scene.roots.length; r++) walk(scene.roots[r], null);
  }

  function findKey(times, t) {
    var lo = 0, hi = times.length - 1;
    while (lo < hi - 1) {
      var mid = (lo + hi) >> 1;
      if (times[mid] <= t) lo = mid; else hi = mid;
    }
    return lo;
  }

  function applyClip(scene, clip, time) {
    var t = clip.duration > 0 ? time % clip.duration : 0;
    for (var c = 0; c < clip.channels.length; c++) {
      var ch = clip.channels[c], node = scene.nodes[ch.node];
      if (!node) continue;
      var times = ch.input, n = times.length;
      if (!n) continue;
      var i = findKey(times, t);
      var t0 = times[i], t1 = times[Math.min(i + 1, n - 1)];
      var f = (ch.interp === "STEP" || t1 === t0) ? 0 : Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      var o = ch.output, damp = node.damp;
      if (ch.path === "rotation") {
        slerp(o, i * 4, o, Math.min(i + 1, n - 1) * 4, f, node.r);
        if (damp < 1) slerp(node.restR, 0, node.r, 0, damp, node.r);
      } else if (ch.path === "translation" || ch.path === "scale") {
        var dst = ch.path === "translation" ? node.t : node.s;
        var rest = ch.path === "translation" ? node.restT : node.restS;
        var a = i * 3, b = Math.min(i + 1, n - 1) * 3;
        for (var x = 0; x < 3; x++) {
          var val = o[a + x] + (o[b + x] - o[a + x]) * f;
          dst[x] = damp < 1 ? rest[x] + (val - rest[x]) * damp : val;
        }
      }
      node.matrix = null;
    }
  }

  /* ------------------------------------------------ WebGL renderer */
  function vertSrc(numJoints, skinned) {
    return [
      "attribute vec3 aPos;",
      "attribute vec3 aNrm;",
      "attribute vec2 aUV;",
      skinned ? "attribute vec4 aJoints; attribute vec4 aWeights;" : "",
      "uniform mat4 uProj, uView, uModel;",
      skinned ? "uniform mat4 uJoints[" + numJoints + "];" : "",
      "varying vec3 vNrm; varying vec2 vUV;",
      "void main() {",
      skinned
        ? "  mat4 skin = aWeights.x * uJoints[int(aJoints.x)] + aWeights.y * uJoints[int(aJoints.y)] + aWeights.z * uJoints[int(aJoints.z)] + aWeights.w * uJoints[int(aJoints.w)];"
        : "  mat4 skin = mat4(1.0);",
      "  vec4 p = uModel * skin * vec4(aPos, 1.0);",
      "  vNrm = mat3(uModel) * mat3(skin) * aNrm;",
      "  vUV = aUV;",
      "  gl_Position = uProj * uView * p;",
      "}"
    ].join("\n");
  }
  var FRAG = [
    "precision mediump float;",
    "varying vec3 vNrm; varying vec2 vUV;",
    "uniform sampler2D uTex; uniform vec4 uBase; uniform float uHasTex;",
    "void main() {",
    "  vec3 n = normalize(vNrm);",
    "  vec4 base = mix(uBase, texture2D(uTex, vUV) * uBase, uHasTex);",
    "  vec3 key = normalize(vec3(0.4, 0.8, 0.6));",
    "  float diff = max(dot(n, key), 0.0);",
    "  float fill = max(dot(n, normalize(vec3(-0.5, 0.1, -0.4))), 0.0);",
    "  vec3 h = normalize(key + vec3(0.0, 0.0, 1.0));",
    "  float spec = pow(max(dot(n, h), 0.0), 42.0) * 0.28;",
    "  float rim = pow(1.0 - max(n.z, 0.0), 3.0) * 0.10;",
    "  vec3 col = base.rgb * (0.5 + 0.46 * diff + 0.18 * fill) + spec + rim * vec3(0.55, 0.8, 1.0);",
    "  gl_FragColor = vec4(col, base.a);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  function mount(canvas) {
    if (!canvas || !window.GOPHER_GLB_B64) return;
    var gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) { canvas.style.display = "none"; return; }

    var glb = parseGLB(b64ToBytes(window.GOPHER_GLB_B64));
    var scene = buildScene(glb.json, glb.bin);
    var clip = scene.clips[0] || null;
    var skin = scene.skins[0] || null;
    var numJoints = skin ? skin.joints.length : 0;

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc(Math.max(numJoints, 1), !!skin)));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var loc = {
      aPos: gl.getAttribLocation(prog, "aPos"),
      aNrm: gl.getAttribLocation(prog, "aNrm"),
      aUV: gl.getAttribLocation(prog, "aUV"),
      aJoints: gl.getAttribLocation(prog, "aJoints"),
      aWeights: gl.getAttribLocation(prog, "aWeights"),
      uProj: gl.getUniformLocation(prog, "uProj"),
      uView: gl.getUniformLocation(prog, "uView"),
      uModel: gl.getUniformLocation(prog, "uModel"),
      uJoints: gl.getUniformLocation(prog, "uJoints"),
      uTex: gl.getUniformLocation(prog, "uTex"),
      uBase: gl.getUniformLocation(prog, "uBase"),
      uHasTex: gl.getUniformLocation(prog, "uHasTex")
    };

    // Upload geometry. JOINTS/WEIGHTS normalize to float on the fly.
    var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    var draws = scene.prims.map(function (p) {
      if (p.posMin && p.posMax) for (var k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], p.posMin[k]); max[k] = Math.max(max[k], p.posMax[k]);
      }
      function buf(data) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return b;
      }
      var vertCount = p.pos.length / 3;
      var joints = p.joints ? Float32Array.from(p.joints) : null;
      var weights = null;
      if (p.weights) {
        weights = p.weights instanceof Float32Array ? p.weights : (function () {
          var scale = p.weights instanceof Uint8Array ? 255 : 65535;
          var w = new Float32Array(p.weights.length);
          for (var i = 0; i < w.length; i++) w[i] = p.weights[i] / scale;
          return w;
        })();
      }
      var d = {
        pos: buf(p.pos),
        nrm: p.nrm ? buf(p.nrm) : null,
        uv: p.uv ? buf(p.uv) : null,
        joints: joints ? buf(joints) : null,
        weights: weights ? buf(weights) : null,
        count: p.idx ? p.idx.length : vertCount,
        indexed: !!p.idx, idxType: 0, idxBuf: null
      };
      if (p.idx) {
        d.idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, d.idxBuf);
        var idx = p.idx instanceof Uint8Array ? Uint16Array.from(p.idx) : p.idx;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        d.idxType = idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        if (idx instanceof Uint32Array) gl.getExtension("OES_element_index_uint");
      }
      return d;
    });

    // Texture (async decode; flat base color until it lands).
    var tex = gl.createTexture(), hasTex = 0;
    if (scene.texBytes) {
      var url = URL.createObjectURL(new Blob([scene.texBytes], { type: scene.texMime }));
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        // WebGL1 only mipmaps power-of-two textures; an NPOT texture with a
        // mipmap min filter is "incomplete" and silently samples black.
        var pot = (img.width & (img.width - 1)) === 0 && (img.height & (img.height - 1)) === 0;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pot ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (pot) gl.generateMipmap(gl.TEXTURE_2D);
        hasTex = 1;
      };
      img.src = url;
    }

    // Frame the camera on the animated bounds, not the bind pose: the dance
    // sways the whole body sideways, so bind-pose framing clips the extremes.
    // CPU-skin a subsample of vertices across the clip to get the true box.
    if (clip && skin && scene.prims[0] && scene.prims[0].joints) {
      var p0 = scene.prims[0], jm = new Float32Array(numJoints * 16), mtmp = new Float32Array(16);
      var vcount = p0.pos.length / 3, step = Math.max(1, Math.floor(vcount / 400));
      for (var s = 0; s <= 24; s++) {
        applyClip(scene, clip, clip.duration * s / 24);
        updateWorld(scene);
        for (var j0 = 0; j0 < numJoints; j0++) {
          jm.set(m4mul(scene.nodes[skin.joints[j0]].world, skin.ibm.subarray(j0 * 16, j0 * 16 + 16), mtmp), j0 * 16);
        }
        for (var v = 0; v < vcount; v += step) {
          var px = p0.pos[v * 3], py = p0.pos[v * 3 + 1], pz = p0.pos[v * 3 + 2];
          var ox = 0, oy = 0, oz = 0;
          for (var k = 0; k < 4; k++) {
            var w = p0.weights ? p0.weights[v * 4 + k] / (p0.weights instanceof Float32Array ? 1 : (p0.weights instanceof Uint8Array ? 255 : 65535)) : (k === 0 ? 1 : 0);
            if (!w) continue;
            var m0 = p0.joints[v * 4 + k] * 16;
            ox += w * (jm[m0] * px + jm[m0 + 4] * py + jm[m0 + 8] * pz + jm[m0 + 12]);
            oy += w * (jm[m0 + 1] * px + jm[m0 + 5] * py + jm[m0 + 9] * pz + jm[m0 + 13]);
            oz += w * (jm[m0 + 2] * px + jm[m0 + 6] * py + jm[m0 + 10] * pz + jm[m0 + 14]);
          }
          min[0] = Math.min(min[0], ox); max[0] = Math.max(max[0], ox);
          min[1] = Math.min(min[1], oy); max[1] = Math.max(max[1], oy);
          min[2] = Math.min(min[2], oz); max[2] = Math.max(max[2], oz);
        }
      }
    }
    var cx = (min[0] + max[0]) / 2, cy = (min[1] + max[1]) / 2, cz = (min[2] + max[2]) / 2;
    // Half-extents of the animated bounds; rH is the bounding-cylinder radius
    // so the turntable rotation can never swing a pose out of frame.
    var hh = (max[1] - min[1]) / 2 || 1;
    var rH = Math.hypot((max[0] - min[0]) / 2, (max[2] - min[2]) / 2) || 1;
    var FOV = 0.62, tanH = Math.tan(FOV / 2);

    var jointMats = new Float32Array(numJoints * 16);
    var tmp = new Float32Array(16);
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    var start = performance.now();
    function frame(now) {
      if (!canvas.isConnected) return; // page re-rendered; stop this loop
      var t = reduceMotion ? 0.0 : (now - start) / 1000;

      var w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      var pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      gl.viewport(0, 0, pw, ph);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (clip) applyClip(scene, clip, t);
      updateWorld(scene);
      if (skin) {
        for (var j = 0; j < numJoints; j++) {
          var jm = m4mul(scene.nodes[skin.joints[j]].world, skin.ibm.subarray(j * 16, j * 16 + 16), tmp);
          jointMats.set(jm, j * 16);
        }
        gl.uniformMatrix4fv(loc.uJoints, false, jointMats);
      }

      // Fit both height and width for the current canvas aspect, so narrow
      // (mobile) and wide canvases alike keep every dance pose in frame.
      var aspect = pw / ph;
      var dist = Math.max(hh / tanH, rH / (tanH * aspect)) * 1.06 + rH;
      var eye = [cx, cy + hh * 0.22, cz + dist];
      var view = m4lookAt(eye, [cx, cy, cz], [0, 1, 0]);
      var proj = m4perspective(FOV, aspect, dist * 0.1, dist + rH * 6);
      var model = m4rotY(reduceMotion ? -0.35 : Math.sin(t * 0.35) * 0.55 - 0.1);
      // Turntable pivots around the model center, not the origin.
      var pre = m4ident(); pre[12] = -cx; pre[13] = -cy; pre[14] = -cz;
      var post = m4ident(); post[12] = cx; post[13] = cy; post[14] = cz;
      model = m4mul(post, m4mul(model, pre));

      gl.uniformMatrix4fv(loc.uProj, false, proj);
      gl.uniformMatrix4fv(loc.uView, false, view);
      gl.uniformMatrix4fv(loc.uModel, false, model);
      gl.uniform4fv(loc.uBase, scene.baseColor);
      gl.uniform1f(loc.uHasTex, hasTex);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.uTex, 0);

      for (var d = 0; d < draws.length; d++) {
        var dr = draws[d];
        gl.bindBuffer(gl.ARRAY_BUFFER, dr.pos);
        gl.enableVertexAttribArray(loc.aPos);
        gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
        if (dr.nrm && loc.aNrm >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dr.nrm);
          gl.enableVertexAttribArray(loc.aNrm);
          gl.vertexAttribPointer(loc.aNrm, 3, gl.FLOAT, false, 0, 0);
        }
        if (dr.uv && loc.aUV >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dr.uv);
          gl.enableVertexAttribArray(loc.aUV);
          gl.vertexAttribPointer(loc.aUV, 2, gl.FLOAT, false, 0, 0);
        }
        if (dr.joints && loc.aJoints >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dr.joints);
          gl.enableVertexAttribArray(loc.aJoints);
          gl.vertexAttribPointer(loc.aJoints, 4, gl.FLOAT, false, 0, 0);
        }
        if (dr.weights && loc.aWeights >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dr.weights);
          gl.enableVertexAttribArray(loc.aWeights);
          gl.vertexAttribPointer(loc.aWeights, 4, gl.FLOAT, false, 0, 0);
        }
        if (dr.indexed) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dr.idxBuf);
          gl.drawElements(gl.TRIANGLES, dr.count, dr.idxType, 0);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, dr.count);
        }
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.GOPHER3D = { mount: mount };
})();
