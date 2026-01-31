<template>
  <div class="nav-links">
    <ul class="tree">
      <li>
        Attacks
        <ul>
          <li>
            <NuxtLink to="/attack/list">Attacks</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/attack-asset/list">Attack Assets</NuxtLink>
          </li>
        </ul>
      </li>
      <li>
        Mons
        <ul>
          <li><NuxtLink to="/mon/list">Mons</NuxtLink></li>
        </ul>      
      </li>
      <li>
        Items
        <ul>
          <li><NuxtLink to="/item/list">Items</NuxtLink></li>
          <li><NuxtLink to="/item-type/list">Item Types</NuxtLink></li>
        </ul>
      </li>
    </ul>
  </div>
</template>
<style scoped>
/* Base list reset */
ul.tree {
  list-style: none;
  padding-left: 0;
  margin: 0;
  font-size: 0.95rem;
}

/* List items */
ul.tree li {
  position: relative;
  padding: 6px 0 6px 1.25rem;
  line-height: 1.4;
  list-style-type: none;
}

/* Vertical guide line */
ul.tree li::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0.45rem;
  width: 1px;
  height: 100%;
  background: #e5e7eb; /* light gray */
}

/* Horizontal connector */
ul.tree li::after {
  content: '';
  position: absolute;
  top: 1.1em;
  left: 0.45rem;
  width: 0.6rem;
  height: 1px;
  background: #e5e7eb;
}

/* Remove line on last child */
ul.tree li:last-child::before {
  height: 1.1em;
}

/* Nested lists */
ul.tree ul {
  margin-top: 4px;
  padding-left: 1rem;
}

/* Hover */
ul.tree li:hover {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}

</style>