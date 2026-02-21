export const PARTICLE_RENDER_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in float vSpeed;
out vec4 outColor;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float dist = length(centered);
  float mask = smoothstep(0.5, 0.03, dist);

  float speed = clamp(vSpeed * 2.4, 0.0, 1.0);
  vec3 cold = vec3(0.36, 0.50, 0.66);
  vec3 hot = vec3(0.66, 0.80, 0.95);
  vec3 color = mix(cold, hot, speed);

  float alpha = mask * (0.03 + speed * 0.18);
  outColor = vec4(color, alpha);
}
`;
