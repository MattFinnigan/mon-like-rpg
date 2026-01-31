<template>
  <div>
    <div class="top-row">
      <h2>Attack Asset List</h2>
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
   *  list: import('../../../../../src/types/typedef').AttackAsset[]
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
      const res = await $fetch('/api/attack-asset/list')
      this.list = res
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').AttackAsset} attkAsset
     */
    handleView (attkAsset) {
      this.$router.push(`/attack-asset/${attkAsset.id}`)
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').AttackAsset} attkAsset
     */
    handleCopy (attkAsset) {
      
    },
    /**
     *
     * @param {import('../../../../../src/types/typedef').AttackAsset} attkAsset
     */
    async handleDelete (attkAsset) {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/attack-asset/${attkAsset.id}`, {
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
      this.$router.push('/attack-asset/create')
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