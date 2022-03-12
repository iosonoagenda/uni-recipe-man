<template>
  <button :title="$root.trans.back" type="button" @click="back">
    <i class="fas fa-arrow-left"></i>
  </button>
</template>

<script>
export default {
  name: "BackButton",
  methods: {
    back() {
      this.$router.back();
    }
  }
}
</script>

<style scoped>

</style>