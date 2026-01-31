<template>
  <div class="view-container">
    <div class="top-row">
      <div class="heading-contain">
        <h2>
          <slot name="heading"></slot>
        </h2>
      </div>
      <div v-if="!editing" class="buttons">
        <button class="btn" @click="$emit('edit')">Edit</button>
        <button class="btn" @click="$emit('copy')">Copy</button>
        <button class="btn" @click="$emit('delete')">Delete</button>
      </div>
      <div v-else class="buttons">
        <button type="submit" form="form" class="btn">Save</button>
        <button class="btn" @click="$emit('cancel')">Cancel</button>
      </div>
    </div>
    <div class="content-container">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<script>

  export default {
    emits: ['edit', 'copy', 'delete', 'save', 'cancel', 'back'],
    props: {
      editing: Boolean
    }
  }
</script>
<style scoped>
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .content-container {
    padding: 1em;
    background-color: #f9f9f9;
    border-radius: 0.5rem;
    box-shadow: 0 0 10px rgba(34, 33, 33, 0.25);
  }
  .heading-contain {
    display: flex;
    align-items: center;
    h2 {
      margin-left: 10px;
    }
  } 
</style>