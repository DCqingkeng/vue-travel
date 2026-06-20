<template>
  <div class="place-list">
    <PlaceCard
      v-for="place in places"
      :key="place.id"
      :place="place"
      :active="place.id === activeId"
      :dimmed="Boolean(activeId || hoverId) && place.id !== (hoverId || activeId)"
      @hover="$emit('hover', $event)"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
import PlaceCard from './PlaceCard.vue'

defineProps({
  places: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: [String, Number],
    default: null
  },
  hoverId: {
    type: [String, Number],
    default: null
  }
})

defineEmits(['hover', 'select'])
</script>

<style scoped>
.place-list {
  display: grid;
  gap: 18px;
}
</style>
