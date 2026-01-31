<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Trainer
    </template>
    <template #content>
      <TrainerForm
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
   *  item: import('../../../../../src/types/typedef').Trainer | null
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
      this.form = await $fetch('/api/trainer/new')
    },
    handleCancel () {
      this.$router.push('/trainer/list')
    },
    handleSubmit () {
      this.$router.push('/trainer/list')
    }
  }
}
</script>