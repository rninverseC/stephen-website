function assertFramebufferComplete(gl) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer incomplete: ${status}`);
  }
}

function createTexture(gl, width, height, internalFormat, format, type, filter) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Failed to allocate texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export function createRenderTarget(gl, width, height, internalFormat, format, type, filter = gl.NEAREST) {
  const texture = createTexture(gl, width, height, internalFormat, format, type, filter);
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    gl.deleteTexture(texture);
    throw new Error("Failed to allocate framebuffer");
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  assertFramebufferComplete(gl);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    width,
    height,
    texture,
    framebuffer,
    dispose() {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    }
  };
}

export function createDoubleFBO(gl, width, height, internalFormat, format, type, filter = gl.NEAREST) {
  const read = createRenderTarget(gl, width, height, internalFormat, format, type, filter);
  const write = createRenderTarget(gl, width, height, internalFormat, format, type, filter);

  return {
    width,
    height,
    read,
    write,
    swap() {
      const temp = this.read;
      this.read = this.write;
      this.write = temp;
    },
    dispose() {
      read.dispose();
      write.dispose();
    }
  };
}
