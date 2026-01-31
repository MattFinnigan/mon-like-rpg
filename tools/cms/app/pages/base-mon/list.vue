<template>
  <div>
    <TableComponent :contents="list" name="base-mon"/>
  </div>
</template>

<script>

export default {
  /**
   * @returns {{
   *  list: import('../../../../../src/types/typedef').BaseMon[]
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
      const res = await $fetch('/api/base-mon/list')

      // this.list = Object.keys(res).map(baseMonIndex => {
      //   return res[baseMonIndex]
      // })
    }
  }
}
</script>