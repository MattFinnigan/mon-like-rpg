<template>
  <ViewComponent
    :editing="editing"
    @cancel="handleCancel"
    @edit="handleEdit"
    @copy="handleCopy"
    @delete="handleDelete">
    <template #heading>
      {{ heading }}
    </template>
    <template #content>
      <div v-if="!editing && item" class="viewing-mode">
        <DisplayField label="id" :value="item.id" />
        <DisplayField label="Base Mon Index" :value="item.baseMonIndex" />
        <DisplayField label="Name" :value="item.name" />
        <DisplayField label="Current HP" :value="item.currentHp" />
        <DisplayField label="Current Level" :value="item.currentLevel" />
        <DisplayField label="Attack" :value="item.attackEV" />
        <DisplayField label="Defense" :value="item.defenseEV" />
        <DisplayField label="Spl Attack" :value="item.splAttackEV" />
        <DisplayField label="Spl Defense" :value="item.splDefenseEV" />
        <DisplayField label="Speed" :value="item.speedEV" />
        <DisplayField label="HP EV" :value="item.hpEV" />
        <DisplayField label="Attacks" :value="attackNames" />
      </div>
      <MonForm
        v-if="editing"
        :initial-form="item"
        @submitted="onSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>

export default {
  /**
   * @returns {{
   *  item: import('../../../../../src/types/typedef').Mon | null
   *  editing: boolean,
   *  attacks: import('../../../../../src/types/typedef').Attack[]
   * }}
   */
  data () {
    return {
      item: null,
      editing: false,
      attacks: []
    }
  },
  mounted () {
    this.fetchItem()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing Mon "${this.item?.name}"`
      }
      return `Viewing Mon "${this.item?.name}"`
    },
    attackNames () {
      if (!this.attacks) {
        return
      }
      return this.attacks.filter(attk => {
        return this.item.attackIds.includes(attk.id)
      }).map(attk => attk.name).join(', ')
    }
  },
  methods: {
    async fetchItem () {
      const id = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').Mon} */
      const res = await $fetch(`/api/mon/${id}`)
      this.item = res

      /** @type {import('../../../../../src/types/typedef').Attack[]} */
      const res2 = await $fetch(`/api/attack/list`)
      this.attacks = res2
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/mon/${this.item.id}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/mon/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    async handleCancel () {
      await this.fetchItem()
      this.editing = false
    },
    async onSubmit () {
      await this.fetchItem()
      this.editing = false
    }
  }
}
</script>