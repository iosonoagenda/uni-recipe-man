<template>
  <div class="recipe-list">
    <div class="recipe-search-container">
      <input v-model="search" :placeholder="$root.trans.search" :title="$root.trans.search" autofocus
             class="recipe-search" type="search">
      <button :title="$root.trans.recipeAdd" type="button" @click="addRecipe">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <ul class="recipe-result">
      <li v-for="recipe in filteredRecipes" :key="recipe.name" class="recipe">
        <div class="recipe-title">
          <span v-if="recipe.category" class="badge">{{ recipe.category }}</span>
          {{ recipe.quantity }} &times; {{ recipe.output }}
        </div>
        <div class="recipe-show">
          <input v-model="recipe.amount" :min="1"
                 :title="$root.trans.recipeAmount" type="number" @input="validate(recipe, 'amount')">
          <button :title="$root.trans.recipeShow" type="button" @click="showRecipe(recipe)">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <button :title="$root.trans.recipeEdit" type="button" @click="editRecipe(recipe)">
          <i class="fas fa-pen"></i>
        </button>
        <button :title="$root.trans.recipeDelete" type="button" @click="deleteRecipe(recipe)">
          <i class="fas fa-trash"></i>
        </button>
      </li>
      <li v-if="filteredRecipes.length === 0" class="no-results">
        <h3>
          <span>{{ $root.trans.noResults }}</span>
        </h3>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "RecipeList",
  data: () => {
    return {
      recipes: [],
      search: '',
      validators: {
        amount: value => value > 0
      },
      defaults: {
        amount: 1
      }
    };
  },
  methods: {
    validate(recipe, field) {
      if (typeof recipe[field] !== 'undefined'
          && typeof this.validators[field] !== 'undefined'
          && typeof this.defaults[field] !== 'undefined') {
        if (!this.validators[field](recipe[field])) {
          recipe[field] = this.defaults[field];
        }
      }
    },
    showRecipe(recipe) {
      this.$router.push(`/${recipe.file}/${recipe.amount}`);
    },
    addRecipe() {
      this.$router.push('/create');
    },
    editRecipe(recipe) {
      this.$router.push(`/edit/${recipe.file}`);
    },
    deleteRecipe(recipe) {
      if (window.ipcRenderer.sendSync('recipe:delete', recipe.file) === 0) {
        this.recipes = this.recipes.filter(r => r.file !== recipe.file);
      }
    }
  },
  computed: {
    filteredRecipes() {
      return this.recipes
          .filter(recipe => {
            const regex = new RegExp(this.search.toLowerCase().replace(/([()[\]])/g, "\\$1").replaceAll(' ', '(.)*?'), 'g');
            return regex.test(`${recipe.category ? recipe.category.toLowerCase() : ''}${recipe.output.toLowerCase()}`);
          }).sort((ra, rb) => {
            if (ra.category === rb.category) {
              return ra.output.localeCompare(rb.output);
            }
            if (ra.category) {
              return ra.category.localeCompare(rb.category);
            }
            return 0;
          });
    }
  },
  mounted() {
    this.$root.precision = true;
    this.recipes = window.ipcRenderer.sendSync('recipe:all');
  }
}
</script>

<style scoped>
.recipe-list {
  display: flex;
  flex-direction: column;
}

.recipe-result {
  list-style: none;
  height: 100%;
  flex: 1;
}

.recipe {
  padding: var(--urm-spacing);
}

.recipe, .recipe > .recipe-show, .recipe-search-container {
  display: flex;
  flex-direction: row;
}

.recipe > .recipe-title {
  width: 100%;
}

.recipe > .recipe-show > :first-child {
  border-right: 0;
}

.recipe > .recipe-show > :last-child {
  border-left: 0;
}

.recipe:nth-child(even) {
  background-color: var(--urm-alt);
}

.recipe-search {
  width: 100%;
}

.badge {
  border: var(--urm-border-out) var(--urm-color);
}

h3 {
  text-align: center;
}
</style>