const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.Bre0BNhG.js",app:"_app/immutable/entry/app.BnUgGiHT.js",imports:["_app/immutable/entry/start.Bre0BNhG.js","_app/immutable/chunks/Cv7WNtG6.js","_app/immutable/chunks/CvmZDYTs.js","_app/immutable/chunks/BGk_9FmB.js","_app/immutable/entry/app.BnUgGiHT.js","_app/immutable/chunks/BGk_9FmB.js","_app/immutable/chunks/CvmZDYTs.js","_app/immutable/chunks/E7NgtQj1.js","_app/immutable/chunks/k-yb9S9W.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:true},
		nodes: [
			__memo(() => import('./chunks/0-j2NQxov_.js')),
			__memo(() => import('./chunks/1-DTSzQdKH.js')),
			__memo(() => import('./chunks/2-MFuKD7Nb.js'))
		],
		remotes: {
			'1a287au': __memo(() => import('./chunks/remote-1a287au-Vg7VjA9W.js')),
			'x98l3z': __memo(() => import('./chunks/remote-x98l3z-C33DPk3P.js')),
			'froafq': __memo(() => import('./chunks/remote-froafq-CepKpWZw.js')),
			'1ugnjef': __memo(() => import('./chunks/remote-1ugnjef-DBz1G8qd.js'))
		},
		routes: [
			{
				id: "/[...path]",
				pattern: /^(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
