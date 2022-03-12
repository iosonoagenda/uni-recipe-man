import {createApp} from 'vue'
import App from './App.vue'
import {createRouter, createWebHashHistory} from "vue-router";
import RecipeEdit from "@/components/RecipeEdit";
import RecipeList from "@/components/RecipeList";
import RecipeCreate from "@/components/RecipeCreate";
import RecipeShow from "@/components/RecipeShow";

const routes = [
    {
        path: '/',
        component: RecipeList
    },
    {
        path: '/:file/:amount',
        component: RecipeShow
    },
    {
        path: '/create',
        component: RecipeCreate
    },
    {
        path: '/edit/:file',
        component: RecipeEdit
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const app = createApp(App);

app.use(router);

app.mount('#app')
