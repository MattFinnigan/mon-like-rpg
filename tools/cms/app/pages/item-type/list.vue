<template>
  <div>
    <div class="top-row">
      <h2>Items Types List</h2>
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
   *  list: import('../../../../../src/types/typedef').ItemType[]
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
      const res = await $fetch('/api/item-type/list')
      this.list = res
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').ItemType} itemType
     */
    handleView (itemType) {
      this.$router.push(`/item-type/${itemType.key}`)
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').ItemType} itemType
     */
    handleCopy (itemType) {
      
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').ItemType} itemType
     */
    async handleDelete (itemType) {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/item-type/${itemType.key}`, {
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
      this.$router.push('/item-type/create')
    }
  }
}
</script>