<template>
  <div class="recipe-create">
    <datalist id="categories">
      <option v-for="category in categories" :key="category" :value="category"></option>
    </datalist>
    <div class="output">
      <input v-model="quantity" :min="1" :title="$root.trans.outputQuantity" class="output-quantity" type="number">
      <input v-model="output" :placeholder="$root.trans.outputName" :title="$root.trans.outputName" autofocus
             class="output-name" type="text"
             @keyup.enter="saveRecipe">
      <input v-model="category" :datasrc="categories" :placeholder="$root.trans.outputCategory"
             :title="$root.trans.outputCategory"
             class="output-category" list="categories" type="text"
             @keyup.enter="saveRecipe">
      <button :title="$root.trans.import" type="button" @click="importRecipe">
        <i class="fas fa-file-import"></i>
      </button>
      <button :title="$root.trans.save" type="button" @click="saveRecipe">
        <i class="fas fa-save"></i>
      </button>
      <BackButton/>
    </div>
    <InputList ref="inputList" editable/>
  </div>
</template>

<script>
import InputList from "@/components/InputList";
import BackButton from "@/components/BackButton";

export default {
  name: "RecipeCreate",
  components: {BackButton, InputList},
  data: () => {
    return {
      recipes: [],
      category: '',
      output: '',
      quantity: 1
    };
  },
  methods: {
    saveRecipe() {
      if (this.output && this.output.length > 0) {
        const result = window.ipcRenderer.sendSync('recipe:create', JSON.stringify({
          output: this.output,
          quantity: this.quantity,
          category: this.category,
          inputs: this.$refs.inputList.inputs.map(inp => {
            return {file: inp.file, quantity: inp.quantity}
          })
        }));
        if (result === 0) {
          return;
        }
      }
      this.$router.back();
    },
    importRecipe() {
      if (window.ipcRenderer.sendSync('recipe:import') > 0) {
        this.$router.back();
      }
    }
  },
  created() {
    this.recipes = window.ipcRenderer.sendSync('recipe:all');
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

.output-quantity::after, .input-quantity::after {
  content: " &times; ";
  font-weight: bolder;
}
</style>