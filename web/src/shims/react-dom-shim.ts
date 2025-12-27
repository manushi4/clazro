// React DOM shim for React 19 compatibility with react-native-web
// React 19 removed legacy APIs that react-native-web still uses

import * as ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

// Re-export all modern APIs
export * from 'react-dom';

// Shim for findDOMNode (deprecated in React 18, removed in React 19)
export function findDOMNode(component: any): Element | null | Text {
  if (component == null) {
    return null;
  }
  if (component.nodeType === 1) {
    return component;
  }
  // For class components with refs
  if (component._reactInternals || component._reactInternalFiber) {
    console.warn('findDOMNode is deprecated. Use refs instead.');
    return null;
  }
  return null;
}

// Shim for legacy render (removed in React 19)
export function render(element: React.ReactElement, container: Element | DocumentFragment): void {
  console.warn('ReactDOM.render is deprecated. Use createRoot instead.');
  const root = createRoot(container);
  root.render(element);
}

// Shim for legacy hydrate (removed in React 19)
export function hydrate(element: React.ReactElement, container: Element | DocumentFragment): void {
  console.warn('ReactDOM.hydrate is deprecated. Use hydrateRoot instead.');
  hydrateRoot(container, element);
}

// Shim for unmountComponentAtNode (removed in React 19)
export function unmountComponentAtNode(container: Element | DocumentFragment): boolean {
  console.warn('ReactDOM.unmountComponentAtNode is deprecated. Use root.unmount() instead.');
  // In React 19, we can't really unmount without the root reference
  // This is a no-op shim
  return true;
}

// Export createRoot and hydrateRoot for modern usage
export { createRoot, hydrateRoot };

export default {
  ...ReactDOM,
  findDOMNode,
  render,
  hydrate,
  unmountComponentAtNode,
  createRoot,
  hydrateRoot,
};
