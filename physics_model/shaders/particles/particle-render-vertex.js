export const PARTICLE_RENDER_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in float aIndex;

uniform sampler2D uPositions;
uniform sampler2D uVelocity;
uniform float uTextureSize;
uniform float uPointSize;

out float vSpeed;

void main() {
  float index = aIndex;
  float x = mod(index, uTextureSize);
  float y = floor(index / uTextureSize);
  vec2 uv = (vec2(x, y) + 0.5) / uTextureSize;

  vec2 pos = texture(uPositions, uv).xy;
  vec2 velocity = texture(uVelocity, pos).xy;
  vSpeed = length(velocity);

  vec2 clip = pos * 2.0 - 1.0;
  clip.y *= -1.0;

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = uPointSize;
}
`;
