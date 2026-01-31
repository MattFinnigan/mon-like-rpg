<template>
  <div>
    <TableComponent :contents="list" name="mon"/>
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
  
      this.list = Object.keys(res).map(id => {
        return {
          id: parseInt(id),
          ...res[parseInt(id)]
        }
      })
    }
  }
}
</script>