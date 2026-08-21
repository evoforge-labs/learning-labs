/// <reference types="astro/client" />

// Font packages are CSS-only, no TS declarations needed
declare module '@fontsource-variable/inter';
declare module '@fontsource/spectral/400.css';
declare module '@fontsource/spectral/600.css';
declare module '@fontsource/spectral/700.css';

// cytoscape layout extensions ship no type declarations
declare module 'cytoscape-fcose';
declare module 'cytoscape-cola';
