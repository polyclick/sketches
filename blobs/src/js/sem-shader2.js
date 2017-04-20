export const VERTEX_SHADER = `
	varying vec3 e;
	varying vec3 n;

	void main() {

		e = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));
		n = normalize(normalMatrix * normal);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

	}
`

export const FRAGMENT_SHADER = `
	uniform sampler2D tMatCap;
	varying vec3 e;
	varying vec3 n;

	void main() {

		vec3 r = reflect(e, n);
		//r = e - 2. * dot(n, e) * n;
		float m = 2. * sqrt(pow(r.x, 2.) + pow(r.y, 2.) + pow(r.z + 1., 2.));
		vec2 vN = r.xy / m + .5;
		vec3 base = texture2D(tMatCap, vN).rgb;
		gl_FragColor = vec4(base, 1.);

	}
`