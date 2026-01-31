<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Attack Asset
    </template>
    <template #content>
      <AttackAssetForm
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
   *  item: import('../../../../../src/types/typedef').AttackAsset | null
   * }}
   */
  data () {
    return {
      form: null
    }
  },
  mounted () {
    this.createNewAttackAsset()
  },
  computed: {
  },
  methods: {
    async createNewAttackAsset () {
      this.form = await $fetch('/api/attack-asset/new')
    },
    handleCancel () {
      this.$router.push('/attack-asset/list')
    },
    handleSubmit () {
      this.$router.push('/attack-asset/list')
    }
  }
}
</script>