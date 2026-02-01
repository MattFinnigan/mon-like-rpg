<template>
  <ViewComponent
    :editing="editing"
    @cancel="handleCancel"
    @edit="handleEdit"
    @copy="handleCopy">
    <template #heading>
      {{ heading }}
    </template>
    <template #content>
      <div v-if="!editing && item && attacks" class="viewing-mode">
        <h3>Player</h3>
        <div class="section">
          <DisplayField label="Pos X" :value="item.player.position.x" />
          <DisplayField label="Pos Y" :value="item.player.position.y" />
          <DisplayField label="Direction" :value="item.player.direction" />
          <DisplayField label="Name" :value="item.player.name" />
        </div>
        <h3>Inventory</h3>
        <div class="section">
          <div v-for="actualItem in item.player.inventory" class="item">
            <DisplayField label="Item Key" :value="actualItem.itemKey" />
            <DisplayField label="Qty" :value="actualItem.qty" />
          </div>
        </div>
        <h3>Mons</h3>
        <div class="section">
          <div v-for="mon in item.player.partyMons" class="item">
            <DisplayField label="id" :value="mon.id" />
            <DisplayField label="Base Mon Index" :value="mon.baseMonIndex" />
            <DisplayField label="Name" :value="mon.name" />
            <DisplayField label="Current HP" :value="mon.currentHp" />
            <DisplayField label="Current Level" :value="mon.currentLevel" />
            <DisplayField label="Attacks" :value="getMonAttackNames(mon)" />
          </div>
        </div>
      </div>
      <SaveDataForm
        v-if="editing"
        :dev="true"
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
   *  item: import('../../../../../src/types/typedef').GlobalState | null
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
        return `Editing DEV Save Data `
      }
      return `Viewing DEV Save Data`
    }
  },
  methods: {
    async fetchItem () {
      const key = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').GlobalState} */
      const res = await $fetch(`/api/dev-save-data/view`)
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
    async handleCancel () {
      await this.fetchItem()
      this.editing = false
    },
    async onSubmit () {
      await this.fetchItem()
      this.editing = false
    },
    getMonAttackNames (mon) {
      return this.attacks.filter(attk => {
        return mon.attackIds.includes(attk.id)
      }).map(attk => attk.name).join(', ')
    }
  }
}
</script>
<style scoped>
.item {
  border-bottom: 1px solid grey;
  padding: 1em 0;
}
</style>