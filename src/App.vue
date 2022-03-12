<template>
  <RouterView></RouterView>
</template>

<script>
import {RouterView} from 'vue-router';
import 'fontawesome-free/js/all.min';

export default {
  name: 'App',
  components: {
    RouterView
  },
  data: () => {
    return {
      precision: true,
      trans: {}
    };
  },
  mounted() {
    this.trans = window.ipcRenderer.sendSync('trans');
  }
}
</script>

<style>
@import "fontawesome-free/css/all.min.css";

:root {
  --urm-color: #33fafa;
  --urm-background: #333333;
  --urm-alt: #3333fa;
  --urm-active: #fafafa;
  --urm-border-in: .3rem ridge;
  --urm-border-out: .3rem outset;
  --urm-spacing: .3rem .6rem;
}

* {
  box-sizing: border-box;
  font-family: Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  outline: none;
  text-decoration: none;
}

button, input, select {
  border: var(--urm-border-out) var(--urm-active);
  background-color: var(--urm-alt);
  color: var(--urm-color);
  padding: var(--urm-spacing);
}

input:not([type=button], [type=submit], [type=reset]) {
  border: var(--urm-border-in) var(--urm-active);
}

html, body, #app {
  width: 90vw;
  margin: 0 auto;
  height: 100vh;
  background-color: var(--urm-background);
  color: var(--urm-color);
  text-shadow: 0 0 .2rem var(--urm-active);
}

input[min] {
  width: 5rem;
}

#app {
  padding: var(--urm-spacing);
}
</style>
