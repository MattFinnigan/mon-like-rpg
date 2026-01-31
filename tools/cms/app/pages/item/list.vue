<template>
  <div>
    <div>
      <h2>Items List</h2>
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
   *  list: import('../../../../../src/types/typedef').Item[]
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
      const res = await $fetch('/api/item/list')
      this.list = res
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Item} item
     */
    handleView (item) {
      this.$router.push(`/item/${item.key}`)
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Item} item
     */
    handleCopy (item) {
      
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').Item} item
     */
    async handleDelete (item) {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/item/${item.key}`, {
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
      this.$router.push('/item/create')
    }
  }
}
</script>