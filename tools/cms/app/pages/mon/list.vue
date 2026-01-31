<template>
  <div>
    <div class="top-row">
      <h2>Mons List</h2>
      <button class="btn" @click="handleNew">New</button>
    </div>
    <TableComponent
      :contents="list"
      name="item"
      @view="handleView"
      @copy="handleCopy"
      @delete="handleDelete"/>
  </div>
</template>

<script>

export default {
  /**
   * @returns {{
   *  list: import('../../../../../src/types/typedef').Mon[]
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
      const res = await $fetch('/api/mon/list')
      this.list = res
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Mon} item
     */
    handleView (item) {
      this.$router.push(`/mon/${item.id}`)
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Mon} item
     */
    handleCopy (item) {
      
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Mon} item
     */
    async handleDelete (item) {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/mon/${item.id}`, {
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
      this.$router.push('/mon/create')
    }
  }
}
</script>
<style scoped>
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>