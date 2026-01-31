<template>
  <div>
    <TableComponent :contents="itemsList" />
  </div>
</template>

<script>

import TableComponent from '~/common/TableComponent.vue'

export default {
  components: {
    TableComponent
  },
  /**
   * @returns {{
   *  itemList: import('../../../../src/types/typedef').Item[]
   * }}
   */
  data () {
    return {
      itemsList: []
    }
  },
  mounted () {
    this.fetchItemsList()
  },
  methods: {
    async fetchItemsList () {
      const res = await $fetch('/api/items/list')
      this.itemsList = res
    }
  }
}
</script>