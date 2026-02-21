export function createWebGLContext(canvas) {
  if (!canvas) {
    return null;
  }

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    return null;
  }

  const hasColorFloat = gl.getExtension("EXT_color_buffer_float");
  if (!hasColorFloat) {
    return null;
  }

  gl.getExtension("OES_texture_float_linear");
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  return gl;
}
