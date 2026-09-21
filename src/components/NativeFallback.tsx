import React from 'react';

interface Props {
  /** What to draw when the native component fails. */
  fallback: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Draws `fallback` if rendering a native component throws.
 *
 * A native component can fail in ways JavaScript only finds out about at
 * render time: a view config that clashes with React Native's own, or a
 * binary that doesn't carry the component the bundle expects. Both throw
 * from inside the renderer, which takes down the whole screen - and the
 * thing that goes with it is every button on it.
 *
 * Catching here turns that into one button drawn the old way. The error is
 * still reported, so it doesn't hide the problem, it just stops it from
 * being fatal.
 */
export class NativeFallback extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[SkyMatch] componente nativo no disponible, se dibuja el de reserva:', error.message);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
