<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Mon
    </template>
    <template #content>
      <MonForm
        v-if="form"
        :initial-form="form"
        @submitted="handleSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>
export default {
  /**
   * @returns {{
   *  item: import('../../../../../src/types/typedef').Mon | null
   * }}
   */
  data () {
    return {
      form: null
    }
  },
  mounted () {
    this.createNewItem()
  },
  computed: {
  },
  methods: {
    async createNewItem () {
      this.form = await $fetch('/api/mon/new')
    },
    handleCancel () {
      this.$router.push('/mon/list')
    },
    handleSubmit () {
      this.$router.push('/mon/list')
    }
  }
}
</script>