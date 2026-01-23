import { g as get_request_store, a as with_request_store } from './exports-CBVwhdWM.js';
import { e as error, s as stringify_remote_arg, c as create_remote_key, p as public_env } from './shared-server-CjdfL4f1.js';
import { driver, process } from 'gremlin';
import './client-Cmhiik-v.js';

/** @import { RemoteInfo } from 'types' */

/** @type {RemoteInfo['type'][]} */
const types = ['command', 'form', 'prerender', 'query', 'query_batch'];

/**
 * @param {Record<string, any>} module
 * @param {string} file
 * @param {string} hash
 */
function init_remote_functions(module, file, hash) {
	if (module.default) {
		throw new Error(
			`Cannot export \`default\` from a remote module (${file}) — please use named exports instead`
		);
	}

	for (const [name, fn] of Object.entries(module)) {
		if (!types.includes(fn?.__?.type)) {
			throw new Error(
				`\`${name}\` exported from ${file} is invalid — all exports from this file must be remote functions`
			);
		}

		fn.__.id = `${hash}/${name}`;
		fn.__.name = name;
	}
}

function create_validator(validate_or_fn, maybe_fn) {
  if (!maybe_fn) {
    return (arg) => {
      if (arg !== void 0) {
        error(400, "Bad Request");
      }
    };
  }
  if (validate_or_fn === "unchecked") {
    return (arg) => arg;
  }
  if ("~standard" in validate_or_fn) {
    return async (arg) => {
      const { event, state } = get_request_store();
      const result = await validate_or_fn["~standard"].validate(arg);
      if (result.issues) {
        error(
          400,
          await state.handleValidationError({
            issues: result.issues,
            event
          })
        );
      }
      return result.value;
    };
  }
  throw new Error(
    'Invalid validator passed to remote function. Expected "unchecked" or a Standard Schema (https://standardschema.dev)'
  );
}
async function get_response(info, arg, state, get_result) {
  await 0;
  const cache = get_cache(info, state);
  return cache[stringify_remote_arg(arg, state.transport)] ??= get_result();
}
async function run_remote_function(event, state, allow_cookies, arg, validate, fn) {
  const store = {
    event: {
      ...event,
      setHeaders: () => {
        throw new Error("setHeaders is not allowed in remote functions");
      },
      cookies: {
        ...event.cookies,
        set: (name, value, opts) => {
          if (!allow_cookies) {
            throw new Error("Cannot set cookies in `query` or `prerender` functions");
          }
          if (opts.path && !opts.path.startsWith("/")) {
            throw new Error("Cookies set in remote functions must have an absolute path");
          }
          return event.cookies.set(name, value, opts);
        },
        delete: (name, opts) => {
          if (!allow_cookies) {
            throw new Error("Cannot delete cookies in `query` or `prerender` functions");
          }
          if (opts.path && !opts.path.startsWith("/")) {
            throw new Error("Cookies deleted in remote functions must have an absolute path");
          }
          return event.cookies.delete(name, opts);
        }
      }
    },
    state: {
      ...state,
      is_in_remote_function: true
    }
  };
  const validated = await with_request_store(store, () => validate(arg));
  return with_request_store(store, () => fn(validated));
}
function get_cache(info, state = get_request_store().state) {
  let cache = state.remote_data?.get(info);
  if (cache === void 0) {
    cache = {};
    (state.remote_data ??= /* @__PURE__ */ new Map()).set(info, cache);
  }
  return cache;
}
// @__NO_SIDE_EFFECTS__
function query(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = { type: "query", id: "", name: "" };
  const wrapper = (arg) => {
    const { event, state } = get_request_store();
    const get_remote_function_result = () => run_remote_function(event, state, false, arg, validate, fn);
    const promise = get_response(__, arg, state, get_remote_function_result);
    promise.catch(() => {
    });
    promise.set = (value) => update_refresh_value(get_refresh_context(__, "set", arg), value);
    promise.refresh = () => {
      const refresh_context = get_refresh_context(__, "refresh", arg);
      const is_immediate_refresh = !refresh_context.cache[refresh_context.cache_key];
      const value = is_immediate_refresh ? promise : get_remote_function_result();
      return update_refresh_value(refresh_context, value, is_immediate_refresh);
    };
    promise.withOverride = () => {
      throw new Error(`Cannot call '${__.name}.withOverride()' on the server`);
    };
    return (
      /** @type {RemoteQuery<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
// @__NO_SIDE_EFFECTS__
function batch(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = {
    type: "query_batch",
    id: "",
    name: "",
    run: (args) => {
      const { event, state } = get_request_store();
      return run_remote_function(
        event,
        state,
        false,
        args,
        (array) => Promise.all(array.map(validate)),
        fn
      );
    }
  };
  let batching = { args: [], resolvers: [] };
  const wrapper = (arg) => {
    const { event, state } = get_request_store();
    const get_remote_function_result = () => {
      return new Promise((resolve, reject) => {
        batching.args.push(arg);
        batching.resolvers.push({ resolve, reject });
        if (batching.args.length > 1) return;
        setTimeout(async () => {
          const batched = batching;
          batching = { args: [], resolvers: [] };
          try {
            const get_result = await run_remote_function(
              event,
              state,
              false,
              batched.args,
              (array) => Promise.all(array.map(validate)),
              fn
            );
            for (let i = 0; i < batched.resolvers.length; i++) {
              try {
                batched.resolvers[i].resolve(get_result(batched.args[i], i));
              } catch (error2) {
                batched.resolvers[i].reject(error2);
              }
            }
          } catch (error2) {
            for (const resolver of batched.resolvers) {
              resolver.reject(error2);
            }
          }
        }, 0);
      });
    };
    const promise = get_response(__, arg, state, get_remote_function_result);
    promise.catch(() => {
    });
    promise.set = (value) => update_refresh_value(get_refresh_context(__, "set", arg), value);
    promise.refresh = () => {
      const refresh_context = get_refresh_context(__, "refresh", arg);
      const is_immediate_refresh = !refresh_context.cache[refresh_context.cache_key];
      const value = is_immediate_refresh ? promise : get_remote_function_result();
      return update_refresh_value(refresh_context, value, is_immediate_refresh);
    };
    promise.withOverride = () => {
      throw new Error(`Cannot call '${__.name}.withOverride()' on the server`);
    };
    return (
      /** @type {RemoteQuery<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
Object.defineProperty(query, "batch", { value: batch, enumerable: true });
function get_refresh_context(__, action, arg) {
  const { state } = get_request_store();
  const { refreshes } = state;
  if (!refreshes) {
    const name = __.type === "query_batch" ? `query.batch '${__.name}'` : `query '${__.name}'`;
    throw new Error(
      `Cannot call ${action} on ${name} because it is not executed in the context of a command/form remote function`
    );
  }
  const cache = get_cache(__, state);
  const cache_key = stringify_remote_arg(arg, state.transport);
  const refreshes_key = create_remote_key(__.id, cache_key);
  return { __, state, refreshes, refreshes_key, cache, cache_key };
}
function update_refresh_value({ __, refreshes, refreshes_key, cache, cache_key }, value, is_immediate_refresh = false) {
  const promise = Promise.resolve(value);
  if (!is_immediate_refresh) {
    cache[cache_key] = promise;
  }
  if (__.id) {
    refreshes[refreshes_key] = promise;
  }
  return promise.then(() => {
  });
}

class Settings {
  static keys = {
    ipfsURLPattern: "mimis-setting-ipfs-url-pattern",
    ipfsAPI: "mimis-setting-ipfs-api",
    neo4jURL: "mimis-setting-neo4j-url",
    neo4jUser: "mimis-setting-neo4j-user",
    neo4jPass: "mimis-setting-neo4j-pass",
    limit: "mimis-setting-limit",
    debugging: "mimis-setting-debugging",
    useKubo: "mimis-setting-use-kubo",
    kuboUsername: "mimis-setting-kubo-username",
    kuboPassword: "mimis-setting-kubo-password",
    useStoracha: "mimis-setting-use-storacha",
    storachaEmail: "mimis-setting-storacha-email",
    storachaSpace: "mimis-setting-storacha-space",
    detailsZoom: "mimis-setting-details-zoom",
    janusGraphURL: "mimis-setting-janusgraph-url"
  };
  static defaults = {
    [Settings.keys.ipfsURLPattern]: public_env.PUBLIC_IPFS_URL_PATTERN || "http://localhost:8080/ipfs/{cid}{path}",
    [Settings.keys.ipfsAPI]: public_env.PUBLIC_IPFS_API || "http://localhost:5001/api/v0",
    [Settings.keys.neo4jURL]: public_env.PUBLIC_NEO4J_URI || "bolt://localhost:7687",
    [Settings.keys.neo4jUser]: public_env.PUBLIC_NEO4J_USER || "neo4j",
    [Settings.keys.neo4jPass]: public_env.PUBLIC_NEO4J_PASS || "neo4j",
    [Settings.keys.limit]: public_env.PUBLIC_LIMIT ? Number(public_env.PUBLIC_LIMIT) : 125,
    [Settings.keys.debugging]: public_env.PUBLIC_DEBUGGING ? Boolean(public_env.PUBLIC_DEBUGGING) : false,
    [Settings.keys.useKubo]: public_env.PUBLIC_USE_KUBO ? Boolean(public_env.PUBLIC_USE_KUBO) : true,
    [Settings.keys.kuboUsername]: "",
    [Settings.keys.kuboPassword]: "",
    [Settings.keys.useStoracha]: public_env.PUBLIC_USE_STORACHA ? Boolean(public_env.PUBLIC_USE_STORACHA) : false,
    [Settings.keys.storachaEmail]: "",
    [Settings.keys.storachaSpace]: "Mïmis",
    [Settings.keys.detailsZoom]: public_env.PUBLIC_DETAILS_ZOOM ? Number(public_env.PUBLIC_DETAILS_ZOOM) : 1,
    [Settings.keys.janusGraphURL]: public_env.PUBLIC_JANUSGRAPH_URL || "ws://localhost:8182/gremlin"
  };
  constructor(args) {
    Object.entries(args ?? {}).forEach(([key, val]) => {
      switch (key) {
        case "debugging": {
          this.debugging = Boolean(val);
          break;
        }
        case "useKubo": {
          this.useKubo = Boolean(val);
          break;
        }
        case "useStoracha": {
          this.useStoracha = Boolean(val);
          break;
        }
        default: {
          Object.keys(Settings.keys).includes(key) ? this[key] = val : console.warn(`Unhanded constructor argument: "${key}".`);
        }
      }
    });
  }
  valueOf(key) {
    const defaultVal = Settings.defaults[Settings.keys[key]];
    const value = typeof localStorage !== "undefined" ? localStorage.getItem(Settings.keys[key]) : defaultVal;
    if (value != null) {
      if (typeof defaultVal === "number") {
        return Number(value);
      } else if (typeof defaultVal === "boolean") {
        return Boolean(value);
      } else {
        return value;
      }
    } else {
      return defaultVal;
    }
  }
  get values() {
    return new Settings(this);
  }
  set values(settings2) {
    for (const key of Object.keys(Settings.keys)) {
      this[key] = settings2[key];
    }
  }
  ipfsAPI = this.valueOf("ipfsAPI");
  ipfsURLPattern = this.valueOf("ipfsURLPattern");
  neo4jURL = this.valueOf("neo4jURL");
  neo4jUser = this.valueOf("neo4jUser");
  neo4jPass = this.valueOf("neo4jPass");
  limit = this.valueOf("limit");
  debugging = Boolean(this.valueOf("debugging"));
  useKubo = Boolean(this.valueOf("useKubo"));
  kuboUsername = this.valueOf("kuboUsername");
  kuboPassword = this.valueOf("kuboPassword");
  useStoracha = Boolean(this.valueOf("useStoracha"));
  storachaEmail = this.valueOf("storachaEmail");
  storachaSpace = this.valueOf("storachaSpace");
  detailsZoom = this.valueOf("detailsZoom");
  janusGraphURL = this.valueOf("janusGraphURL");
  save(key) {
    if (typeof localStorage !== "undefined") {
      if (key != null) {
        if (this[key] == null || this[key] === "") {
          localStorage.removeItem(Settings.keys[key]);
        } else {
          localStorage.setItem(Settings.keys[key], String(this[key]));
        }
      } else {
        for (const key2 of Object.keys(Settings.keys)) {
          this.save(key2);
        }
      }
    }
  }
}
const settings = new Settings();
const { DriverRemoteConnection } = driver;
function connect() {
  const connection = new DriverRemoteConnection(
    settings.janusGraphURL
  );
  return {
    connection,
    g: process.traversal().withRemote(connection)
  };
}

export { Settings as S, create_validator as a, connect as c, init_remote_functions as i, query as q, run_remote_function as r, settings as s };
//# sourceMappingURL=janusgraph-BdUXYw6T.js.map
