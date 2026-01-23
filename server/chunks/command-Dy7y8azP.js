import { g as get_request_store } from './exports-CBVwhdWM.js';
import { a as create_validator, r as run_remote_function } from './janusgraph-BdUXYw6T.js';

// @__NO_SIDE_EFFECTS__
function command(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = { type: "command", id: "", name: "" };
  const wrapper = (arg) => {
    const { event, state } = get_request_store();
    if (state.is_endpoint_request) {
      if (!["POST", "PUT", "PATCH", "DELETE"].includes(event.request.method)) {
        throw new Error(
          `Cannot call a command (\`${__.name}(${maybe_fn ? "..." : ""})\`) from a ${event.request.method} handler`
        );
      }
    } else if (!event.isRemoteRequest) {
      throw new Error(
        `Cannot call a command (\`${__.name}(${maybe_fn ? "..." : ""})\`) during server-side rendering`
      );
    }
    state.refreshes ??= {};
    const promise = Promise.resolve(run_remote_function(event, state, true, arg, validate, fn));
    promise.updates = () => {
      throw new Error(`Cannot call '${__.name}(...).updates(...)' on the server`);
    };
    return (
      /** @type {ReturnType<RemoteCommand<Input, Output>>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  Object.defineProperty(wrapper, "pending", {
    get: () => 0
  });
  return wrapper;
}

export { command as c };
//# sourceMappingURL=command-Dy7y8azP.js.map
