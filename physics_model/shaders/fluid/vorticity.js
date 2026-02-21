export const VORTICITY_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uStrength;

void main() {
  float curlLeft = abs(texture(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x);
  float curlRight = abs(texture(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x);
  float curlBottom = abs(texture(uCurl, vUv - vec2(0.0, uTexelSize.y)).x);
  float curlTop = abs(texture(uCurl, vUv + vec2(0.0, uTexelSize.y)).x);

  float centerCurl = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(curlTop - curlBottom, curlRight - curlLeft);
  force = force / (length(force) + 0.0001);
  force *= uStrength * centerCurl;

  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * uDt;

  outColor = vec4(velocity, 0.0, 1.0);
}
`;
