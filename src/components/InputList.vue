<template>
  <ul :class="isRoot ? 'input-list root' : 'input-list'">
    <li v-if="isRoot || editable">
      <button v-if="editable" :title="$root.trans.inputAdd" type="button" @click="addInput">
        <i class="fas fa-plus"></i>
      </button>
      <button v-if="!editable && isRoot" :key="wantsPrecision" :title="$root.trans.togglePrecision" type="button"
              @click="togglePrecision">
        <i :class="wantsPrecision ? 'fas fa-check' : 'fas fa-times'"></i>
      </button>
      <select v-if="!editable && isRoot" v-model="selectedGroup" :title="$root.trans.groupBy">
        <option v-for="(value,index) in groups" :key="index" :selected="selectedGroup === index" :value="index">
          {{ value }}
        </option>
      </select>
      <select v-if="selectedGroup === 2" v-model="groupItems" :title="$root.trans.groupItems" multiple>
        <option v-for="recipe in recipes" :key="recipe.file" :value="recipe">
          {{ recipe.output }}
        </option>
      </select>
    </li>
    <li v-for="(input, index) in groupedInputs" :key="input.output" class="input">
      <div v-if="!editable">
        {{ precise(input.quantity, Math.ceil(input.quantity * 100) / 100) }}
        &times;
        {{ input.output }}
      </div>
      <div v-if="editable">
        <input v-model="input.quantity" :min="1" :title="$root.trans.inputQuantity" type="number">
        <select v-model="input.file" :autofocus="input.output === ''" :title="$root.trans.inputName"
                @change="onInputChanged(index)">
          <option selected value="null.recipe.json">(none)</option>
          <option v-for="recipe in recipes" :key="recipe.file" :value="recipe.file">
            {{ recipe.output }}
          </option>
        </select>
        <button :title="$root.trans.inputDelete" type="button" @click="deleteInput(input)">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <!--      :key="child.file"-->
      <!--      v-for="child in (recursive ? input.inputs: [])"-->
      <!--      :amount="(amount * input.quantity) / quantity"-->
      <!--      :quantity="quantity / input.quantity"-->
      <InputList v-if="recursive && selectedGroup === 0"
                 :amount="input.amount"
                 :editable="editable"
                 :file="input.file"
                 :level="level + 1"
                 :quantity="input.quantity"
                 :recursive="recursive"
                 @created="onListCreated"
                 @inputs-changed="(data) => stockAndEmit(data, index)"
      />
    </li>
  </ul>
</template>

<script>
export default {
  name: "InputList",
  props: {
    level: {
      type: Number,
      default: 0
    },
    recursive: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: false
    },
    file: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: 1,
      validator: value => {
        return value > 0;
      }
    },
    quantity: {
      type: Number,
      default: 1,
      validator: value => {
        return value > 0;
      }
    }
  },
  data: () => {
    return {
      recipes: [],
      inputs: [],
      allInputsComplete: false,
      allInputs: [],
      selectedGroup: 0,
      defaultGroupItems: [],
      groupItems: [],
      groups: []
    };
  },
  methods: {
    precise(value, alt) {
      if (this.wantsPrecision) {
        return value;
      }
      return alt;
    },
    addInput() {
      this.inputs.push({
        quantity: 1,
        output: '',
        inputs: []
      });
    },
    togglePrecision() {
      if (this.isRoot) {
        this.$root.precision = !this.$root.precision;
      }
    },
    deleteInput(input) {
      this.inputs = this.inputs.filter(inp => inp.file !== input.file);
    },
    onInputChanged(index = -1) {
      if (index >= 0 && index < this.inputs.length) {
        const input = this.inputs[index];
        const data = window.ipcRenderer.sendSync('recipe:read', input.file);
        data.quantity = input.quantity;
        this.inputs[index] = data;
      }
      if (!this.isRoot) {
        this.$emit('inputsChanged', this.inputs);
      }
    },
    stockAndEmit(data, index) {
      if (index > 0 && index < this.inputs.length && this.inputs[index]) {
        this.inputs[index].inputs = data;
        if (!this.isRoot) {
          this.$emit('inputsChanged', this.inputs);
        }
      }
    },
    resetGroupItems() {
      this.groupItems = this.defaultGroupItems.slice();
    },
    onListCreated(inputs) {
      this.allInputs.push(...inputs);
      if (!this.isRoot) {
        this.allInputs.forEach(input => input.parent = this.file);
        this.$emit('created', this.allInputs);
      }
      // console.log(this.tabs, 'onListCreated says:', this.isRoot, this.allInputs.slice(), inputs);
    }
  },
  created() {
    this.groups = [
      this.$root.trans.none,
      this.$root.trans.notCraftable,
      this.$root.trans.custom
    ];
    this.recipes = window.ipcRenderer.sendSync('recipe:all');
    this.defaultGroupItems = this.recipes.filter(recipe => recipe.inputs.length === 0);
    this.resetGroupItems();
    if (this.file) {
      const inputs = window.ipcRenderer.sendSync('recipe:read', this.file).inputs;
      this.inputs = inputs.slice()
          .map(child => window.ipcRenderer.sendSync('recipe:read', child.file))
          .sort((a, b) => a.output.localeCompare(b.output));
      this.inputs.forEach((child, index) => {
        const neededChildQuantity = inputs[index].quantity * this.amount / (this.isRoot ? this.quantity : 1);
        child.amount = neededChildQuantity / child.quantity;
        child.quantity = child.amount * child.quantity;
      });
      if (this.inputs.length > 0) {
        const ins = this.inputs.slice();
        ins.forEach(input => input.from = this.file);
        this.allInputs.push(...ins);
        if (!this.isRoot) {
          this.$emit('created', this.allInputs);
        }
        // console.log(this.tabs, 'created says:', this.isRoot, this.allInputs.slice(), ins.slice());
      }
    }
  },
  computed: {
    tabs() {
      return '\t'.repeat(this.level);
    },
    wantsPrecision() {
      return this.$root.precision;
    },
    isRoot() {
      return this.$parent.$.type.name !== this.$.type.name;
    },
    groupedInputs() {
      if (this.selectedGroup === 1) {
        this.resetGroupItems();
      }
      if (this.selectedGroup > 0) {
        const items = this.groupItems.slice().map(gi => gi.file);
        const inputs = this.allInputs.slice().sort((a, b) => a.output.localeCompare(b.output));
        const valid = [];
        inputs.forEach(input => {
          const index = valid.findIndex(v => v.from === input.from && v.file === input.file && v.parent === input.parent);
          if (index < 0) {
            valid.push(input);
          }
        });
        const filtered = valid.filter(input => items.includes(input.file));
        const amounts = [];
        filtered.forEach(recipe => {
          const index = amounts.map(a => a.file).indexOf(recipe.file);
          if (index > -1) {
            amounts[index].quantity += recipe.quantity;
          } else {
            const newRecipe = Object.assign({}, recipe);
            delete newRecipe.inputs;
            amounts.push(newRecipe);
          }
        });
        // console.log(this.tabs, 'groupedInputs says:', inputs, valid, amounts);
        return amounts;
      }
      return this.inputs;
    }
  },
  watch: {
    selectedGroup(newSelectedGroup, oldSelectedGroup) {
      if (newSelectedGroup === 0 && oldSelectedGroup !== 0) {
        this.allInputs = this.inputs.slice();
      }
    }
  }
}
</script>

<style scoped>
ul.input-list {
  list-style: none;
}

ul.input-list:not(.root) {
  padding-left: 1.5rem;
  border-left: .1rem solid var(--urm-active);
}
</style>