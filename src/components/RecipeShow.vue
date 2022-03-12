<template>
  <div class="recipe-show">
    <h1>
      <span>{{ recipe.amount }} &times; {{ recipe.output }}</span>
      <BackButton/>
    </h1>
    <InputList :amount="recipe.amount" :file="recipe.file" :quantity="recipe.quantity" recursive/>
  </div>
</template>

<script>
import InputList from "@/components/InputList";
import BackButton from "@/components/BackButton";

export default {
  name: "RecipeShow",
  components: {BackButton, InputList},
  data: () => {
    return {
      recipe: {
        file: 'null.recipe.json',
        output: '',
        quantity: 1,
        amount: 1,
        inputs: []
      }
    };
  },
  methods: {
    back() {
      this.$router.back();
    }
  },
  created() {
    const file = this.$route.params.file;
    const amount = this.$route.params.amount;
    this.recipe = window.ipcRenderer.sendSync('recipe:read', file);
    this.recipe.amount = amount;
  }
}
</script>

<style scoped>
h1 {
  display: flex;
}

h1 > span {
  width: 100%;
}
</style>