<template>
  <div class="block-container">
    <span>Адрес</span>
    <el-input-number v-model="address" @change="changeAddress" size="mini" :controls="false"></el-input-number>
  </div>
</template>

<script>
export default {
  name: 'Controls',
  data() {
    return {
      address: 0,
    }
  },
  methods: {
    changeAddress() {
      console.log(this.address);
    }
  }
}
</script>
