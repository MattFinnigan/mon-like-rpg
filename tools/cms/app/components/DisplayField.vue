<template>
  <div class="display-field">
    <div class="label">
      {{ label }}
    </div>
    <div class="value">
      {{ value }}
    </div>
  </div>
</template>
<script>

export default {
  props: {
    label: String,
    value: {}
  }
}
</script>
<style scoped>
.display-field {
  display: flex;
  margin-bottom: 1em;
  div.label {
    font-weight: bold;
    width: 150px;
  }
}
</style>