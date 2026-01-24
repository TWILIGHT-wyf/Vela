<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<style scoped>
.app-root {
  /* 
    Ensures the application takes full height.
    The background is handled by 'body' in theme.css for the global gradient.
  */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>