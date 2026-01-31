<template>
  <div>
    <div class="top-row">
      <h2>Attacks List</h2>
      <button class="btn" @click="handleNew">New</button>
    </div>
    <TableComponent
      :contents="list"
      @view="handleView"
      @copy="handleCopy"
      @delete="handleDelete"/>
  </div>
</template>

<script>

export default {
  /**
   * @returns {{
   *  list: import('../../../../../src/types/typedef').Attack[]
   * }}
   */
  data () {
    return {
      list: []
    }
  },
  mounted () {
    this.fetchList()
  },
  methods: {
    async fetchList () {
      const res = await $fetch('/api/attack/list')
      this.list = res
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Attack} attack
     */
    handleView (attack) {
      this.$router.push(`/attack/${attack.id}`)
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Attack} attack
     */
    handleCopy (attack) {
      
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Attack} attack
     */
    async handleDelete (attack) {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/attack/${attack.id}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.fetchList()
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    handleNew () {
      this.$router.push('/attack/create')
    }
  }
}
</script>
<style scoped>
.top-row {
  display: flex;
  justify-content: space-between;
  align-attacks: center;
}
</style>