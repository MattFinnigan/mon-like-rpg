<script setup lang="ts">
</script>

<template>
  <div class="container">
    <NavItems />
    <NuxtPage />
  </div>
</template>
<style>
body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0 auto;
  display: flex;

}
.container {
  display: flex;
  width: 95vw;
  justify-content: center;
  max-width: 1600px;
  > * {
    flex: 0.7;
  }
}

.form-list-items {
  li {
    background: #ffffff;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid #ddd;
    display: flex;
    justify-content: space-between;
  }
}

.section {
  border-radius: 0.5em;
  border: 1px solid rgba(0,0,0,0.15);
  padding: 0.5em 1em;
  margin: 1em 0.5em;
  background: #fff;
}

section {
  border-bottom: 2px solid #ddd;
  padding: 0rem 0.75rem;
}

.nav-links {
  flex: 0.3;
}

.btn {
  background-color: rgb(164, 162, 162);
  color: #fff;
  margin: 5px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-decoration: none;
  &.sm {
    font-size: 0.875em;
    padding: 0.4rem 1rem;
  }
}

.btn:hover {
  background-color: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0,0,0,0.15);
}

.btn:active {
  background-color: #3730a3;
  transform: translateY(0);
  box-shadow: 0 3px 4px rgba(0,0,0,0.1);
}

.btn:focus {
  outline: 2px solid #c7d2fe;
  outline-offset: 2px;
}

label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 500;
  color: #374151;
}

input[type="text"],
input[type="number"],
select,
textarea {
  display: block;
  width: 95%;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #1f2937;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="text"]:disabled,
input[type="number"]:disabled,
select:disabled,
textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  margin-right: 0.5rem;
  cursor: pointer;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  accent-color: #3b82f6;
}

label:has(input[type="checkbox"]) {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

label:has(input[type="checkbox"]) span {
  font-weight: 500;
  color: #374151;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>