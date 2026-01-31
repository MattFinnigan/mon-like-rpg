<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Attack
    </template>
    <template #content>
      <AttackForm
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
   *  attack: import('../../../../../src/types/typedef').Attack | null
   * }}
   */
  data () {
    return {
      form: null
    }
  },
  mounted () {
    this.createNewAttack()
  },
  computed: {
  },
  methods: {
    async createNewAttack () {
      this.form = await $fetch('/api/attack/new')
    },
    handleCancel () {
      this.$router.push('/attack/list')
    },
    handleSubmit () {
      this.$router.push('/attack/list')
    }
  }
}
</script>