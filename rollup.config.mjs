import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/umd/simpleinvoicing.js', // Your entry file
  output: {
    file: 'dist/bundle.min.js', // Output bundle
    format: 'umd', // Universal Module Definition
    name: 'simpleinvoicing', // Global variable name when script is included directly in HTML
  },
  plugins: [
    resolve(), // Tells Rollup how to find node_modules
    commonjs(), // Converts CommonJS modules to ES6
    babel({ babelHelpers: 'bundled', presets: ['@babel/preset-env'] }), // Transpile to ES5
    terser()
  ],
};