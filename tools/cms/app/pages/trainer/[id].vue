<template>
  <ViewComponent
    v-if="currentMons.length"
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
        <DisplayField label="ID" :value="item.id" />
        <DisplayField label="Name" :value="item.name" />
        <DisplayField label="Type" :value="item.trainerType" />
        <DisplayField label="Reward" :value="item.rewardOnVictory" />
        <DisplayField label="Pay out" :value="item.payOutOnDefeat" />
        <DisplayField label="Asset key" :value="item.assetKey" />
        <DisplayField label="Defeated message" :value="item.defeatedMsg" />
        <div>
          <label for=""><strong>Mons</strong></label>
          
          <ul class="form-list-items">
            <li v-for="mon in currentMons">
              <span>
                <strong>{{ mon.name }} </strong> Lv{{ mon.currentLevel }}
              </span>
              <button class="btn sm" @click="handleEditTrainerMon(mon.id)">Edit</button>
            </li>
          </ul>
        </div>
      </div>
      <TrainerForm
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
   *  item: import('../../../../../src/types/typedef').Trainer | null
   *  editing: boolean
   *  currentMons: import('../../../../../src/types/typedef').Mon[]
   * }}
   */
  data () {
    return {
      item: null,
      editing: false,
      currentMons: []
    }
  },
  mounted () {
    this.fetchItem()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing Item "${this.item?.name}"`
      }
      return `Viewing Item "${this.item?.name}"`
    }
  },
  methods: {
    handleEditTrainerMon (id) {
      this.$router.push('/mon/' + id, { meta: { edit: true }})
    },
    async fetchItem () {
      const key = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').Trainer} */
      const res = await $fetch(`/api/trainer/${key}`)
      this.item = res
      
      this.item.partyMons.forEach(async id => {
        /** @type {import('../../../../../src/types/typedef').Mon} */
        const res2 = await $fetch(`/api/mon/${id}`)
        this.currentMons.push(res2)
      })
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/trainer/${this.trainer.id}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/trainer/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    async handleCancel () {
      this.currentMons = []
      await this.fetchItem()
      this.editing = false
    },
    async onSubmit () {
      this.currentMons = []
      await this.fetchItem()
      this.editing = false
    }
  }
}
</script>