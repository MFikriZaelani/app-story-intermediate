function splitPathSegments(path) {
  const segments = path.split("/");
  return {
    resource: segments[1] || null,
    id: segments[2] || null,
  };
}

function buildRouteFromSegments(segments) {
  let result = "";

  if (segments.resource) {
    result += `/${segments.resource}`;
  }

  if (segments.id) {
    result += "/:id";
  }

  return result || "/";
}

export function getActivePathname() {
  return window.location.hash.replace("#", "") || "/";
}

export function getActiveRoute() {
  const currentPath = getActivePathname();
  const segments = splitPathSegments(currentPath);
  return buildRouteFromSegments(segments);
}

export function parseActivePathname() {
  const currentPath = getActivePathname();
  return splitPathSegments(currentPath);
}

export function getRoute(path) {
  const segments = splitPathSegments(path);
  return buildRouteFromSegments(segments);
}

export function parsePathname(path) {
  return splitPathSegments(path);
}
