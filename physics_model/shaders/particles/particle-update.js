export const PARTICLE_UPDATE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPositions;
uniform sampler2D uVelocity;
uniform float uDt;
uniform float uTime;
uniform float uSpeedScale;
uniform float uNoise;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 pos = texture(uPositions, vUv).xy;
  vec2 velocity = texture(uVelocity, pos).xy;
  float speed = length(velocity);

  vec2 noise = vec2(
    hash(pos + vec2(uTime, 0.0)),
    hash(pos.yx + vec2(0.0, uTime))
  ) - 0.5;

  pos += velocity * (uDt * uSpeedScale);
  pos += noise * (uNoise * uDt);
  pos = fract(pos + 1.0);

  float reseed = step(0.9968, hash(pos * 29.13 + uTime));
  if (speed < 0.005 && reseed > 0.5) {
    pos = vec2(
      hash(pos + vec2(uTime * 2.11, 3.17)),
      hash(pos + vec2(7.31, uTime * 1.61))
    );
  }

  outColor = vec4(pos, 0.0, 1.0);
}
`;
