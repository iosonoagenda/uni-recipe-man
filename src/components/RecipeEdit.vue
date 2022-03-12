<template>
  <div class="recipe-edit">
    <datalist id="categories">
      <option v-for="category in categories" :key="category" :value="category"></option>
    </datalist>
    <div class="output">
      <input v-model="quantity" :min="1" :title="$root.trans.outputQuantity" class="output-quantity" type="number">
      <input v-model="output" :placeholder="$root.trans.outputName" :title="$root.trans.outputName" autofocus
             class="output-name" type="text"
             @keyup.enter="saveRecipe">
      <input v-model="category" :placeholder="$root.trans.outputCategory" :title="$root.trans.outputCategory"
             class="output-category"
             list="categories" type="text" @keyup.enter="saveRecipe">
      <button :title="$root.trans.save" type="button" @click="saveRecipe">
        <i class="fas fa-save"></i>
      </button>
      <BackButton/>
    </div>
    <InputList ref="inputList" :file="file" editable/>
  </div>
</template>

<script>
import InputList from "@/components/InputList";
import BackButton from "@/components/BackButton";

export default {
  name: "RecipeEdit",
  components: {BackButton, InputList},
  data: () => {
    return {
      category: '',
      file: '',
      recipes: [],
      output: '',
      quantity: 1
    };
  },
  methods: {
    recipeSearch(name) {
      const result = this.recipes.filter(recipe => recipe.output.includes(name));
      if (result.length > 0) {
        return result[0].output;
      } else {
        return '';
      }
    },
    saveRecipe() {
      if (this.output && this.output.length > 0) {
        const result = window.ipcRenderer.sendSync('recipe:update', this.file, JSON.stringify({
          output: this.output,
          quantity: this.quantity,
          category: this.category,
          inputs: this.$refs.inputList.inputs.map(inp => {
            return {file: inp.file, quantity: inp.quantity}
          })
        }));
        if (result === 1) {
          this.$router.back();
        }
      }
    }
  },
  created() {
    this.file = this.$route.params.file;
    const data = window.ipcRenderer.sendSync('recipe:read', this.file);
    this.recipes = window.ipcRenderer.sendSync('recipe:all');
    this.output = data.output;
    this.quantity = data.quantity;
    this.category = data.category;
  },
  computed: {
    categories() {
      const recipes = this.recipes.slice();
      const categories = [];
      recipes.forEach(recipe => {
        if (categories.indexOf(recipe.category) < 0) {
          categories.push(recipe.category);
        }
      });
      return categories;
    }
  }
}
</script>

<style scoped>
.output {
  display: flex;
}

.output-name {
  width: 100%;
}
</style>