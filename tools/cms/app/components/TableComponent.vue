<template>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">
            {{ header }}
          </th>
          <th width="25%"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in contents" :key="rowIndex">
          <td v-for="header in headers" :key="header">
            {{ row[header] }}
          </td>
          <td>
            <button class="btn sm" @click="$emit('view', row)">V</button>
            <button class="btn sm" @click="$emit('copy', row)">C</button>
            <button class="btn sm" @click="$emit('delete', row)">D</button>
          </td>
        </tr>
        <tr v-if="contents.length === 0">
          <td :colspan="headers.length" class="empty">
            No data
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

export default {
  emits: ['view', 'copy', 'delete'],
  props: {
    name: String,
    contents: {
      type: Array,
      default: () => {}
    }
  },
  computed: {
    headers () {
      if (!this.contents.length) {
        return []
      }
      return Object.keys(this.contents[0])
    }
  }
}
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  background: #fff;
  padding: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-family: system-ui, sans-serif;
}

thead th {
  background: #f5f5f5;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid #ddd;
}

tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #eee;
}

tbody tr:hover {
  background-color: #f9f9f9;
}

.empty {
  text-align: center;
  font-style: italic;
  color: #888;
  padding: 1rem 0;
}
</style>
