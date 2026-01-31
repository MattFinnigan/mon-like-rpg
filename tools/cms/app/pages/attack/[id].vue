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
      <div v-if="!editing && attack" class="viewing-mode">
        <DisplayField label="ID" :value="attack.id" />
        <DisplayField label="Name" :value="attack.name" />
        <DisplayField label="Animation Name" :value="attack.animationName" />
        <DisplayField label="Asset Keys" :value="attack.assetKeys" />
        <DisplayField label="Type" :value="attack.typeKey" />
        <DisplayField label="Power" :value="attack.power" />
        <DisplayField label="Crict Modifer" :value="attack.criticalHitModifier" />
        <DisplayField label="Uses Special" :value="attack.usesMonSplStat" />
        <DisplayField label="Status Effect" :value="attack.statusEffect" />
        <DisplayField label="PP" :value="attack.powerPoints" />
        <DisplayField label="Accuracy" :value="attack.accuracy" />
        <DisplayField label="Charging turns" :value="attack.turnsToCharge" />
        <DisplayField label="Coooldown turns" :value="attack.turnsOnCooldown" />
        <DisplayField label="In-effect turns" :value="attack.turnsInEffect" />
        <DisplayField label="Self stats effects" :value="attack.selfBattleStatEffects" />
        <DisplayField label="Opp. stats effects" :value="attack.opponentBattleStatEffects" />
        <DisplayField label="Charging message" :value="attack.chargingMessage" />
        <DisplayField label="Cooldown message" :value="attack.coolDownMessage" />
      </div>
      <AttackForm
        v-if="editing"
        :initial-form="attack"
        @submitted="onSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>

export default {
  /**
   * @returns {{
   *  attack: import('../../../../../src/types/typedef').Attack | null
   *  editing: boolean
   * }}
   */
  data () {
    return {
      attack: null,
      editing: false
    }
  },
  mounted () {
    this.fetchAttack()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing Attack "${this.attack?.name}"`
      }
      return `Viewing Attack "${this.attack?.name}"`
    }
  },
  methods: {
    async fetchAttack () {
      const id = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').Attack} */
      const res = await $fetch(`/api/attack/${id}`)
      this.attack = res
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/attack/${this.attack.id}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/attack/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    handleCancel () {
      this.editing = false
    },
    async onSubmit () {
      await this.fetchAttack()
      this.editing = false
    }
  }
}
</script>