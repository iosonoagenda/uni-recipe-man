// Dependencies

const {app, Menu, MenuItem, BrowserWindow, dialog, ipcMain, shell} = require('electron');
const path = require("path");
const fs = require('fs');
const {homedir} = require('os');
const {name, version} = require('./package.json');
const {Octokit} = require('@octokit/core');

// Constants

const configDir = path.resolve(homedir(), `.chongett.${name}`);
const transDir = configDir;
require('dotenv').config();
const configs = {
    askWhenDelete: true,
    replaceRecipeIfExists: false,
    skipRecipeIfExists: false,
    replaceLangIfExists: false,
    skipLangIfExists: false,
    lang: null,
    relaunchOnNeed: true,
    quitOnArguments: false,
    checkUpdates: true
};
const trans = {
    back: "Go back",
    close: "Close window",
    dontAskAgain: "Don't ask again",
    custom: "Custom",
    groupBy: "Group by",
    groupItems: "Group by given items",
    helpUsage: "Usage: {0} [FILE...]",
    helpWhere: "Where:",
    helpWhereDescription: "\tFILE\tlist of files to import (either *.urmrecipe or *.urmlang)",
    import: "Import",
    inputAdd: "Add an input",
    inputDelete: "Delete input",
    inputName: "Input name",
    inputQuantity: "Input quantity",
    lang: "Lang",
    langExists: "Lang '{0}' already exists. What to do?",
    langFile: "Lang file",
    langFound: "Lang found",
    langImport: "Import lang file(s)",
    no: "No",
    none: "(none)",
    newVersion: "A new version ({0}) was detected. Show site?",
    newerVersion: "Newer version detected!",
    newWindow: "New window",
    notCraftable: "Not craftable items",
    outputCategory: "Output category",
    outputName: "Output name",
    outputQuantity: "Output quantity",
    quit: "Quit",
    recipeAdd: "Add a recipe/Import one or more recipe(s)",
    recipeAmount: "Amount of recipe",
    recipeConfirm: "Are you sure to delete {0}?",
    recipeDelete: "Delete recipe",
    recipeEdit: "Edit recipe",
    recipeExists: "Recipe '{0}' already exists. What to do?",
    recipeFile: "Recipe file",
    recipeFound: "Recipe found",
    recipeSave: "Save recipe file",
    recipeSelect: "Select recipe file(s)",
    recipeShow: "Show recipe",
    replace: "Replace",
    replaceAll: "Replace all",
    save: "Save & close",
    search: "Search for recipe(s)",
    skip: "Skip",
    skipAll: "Skip all",
    togglePrecision: "Toggle precision mode",
    yes: "Yes"
};
const recipeFileFilters = [];
const langFileFilters = [];
let win;

// Methods
const extension = (base = 'recipe', index = 0, baseIndex = 0) => {
    if (base === 'lang') {
        return langFileFilters[baseIndex].extensions[index];
    }
    return recipeFileFilters[baseIndex].extensions[index];
};

const checkUpdates = () => {
    if (configs.checkUpdates) {
        const octo = new Octokit({auth: process.env.GITHUB_KEY});
        octo.request(
            'GET /repos/{owner}/{repo}/releases/latest',
            {
                repo: name,
                owner: process.env.GITHUB_USER
            }
        ).then(res => {
            if (!res.data.tag_name.includes(version)) {
                const action = dialog.showMessageBoxSync(win, {
                    title: trans.newerVersion,
                    message: format(trans.newVersion, res.data.tag_name),
                    buttons: [trans.dontAskAgain, trans.yes]
                });
                if (action === 0) {
                    configs.checkUpdates = false;
                } else {
                    shell.openExternal(res.data.html_url);
                }
            }
        }).catch(err => console.error(err.message));
    }
};
const manageCLIArguments = () => {
    const program = process.argv0;
    const args = process.argv.slice(1);
    // console.log(program, args);
    if (args.length > 0) {
        configs.relaunchOnNeed = false;
        configs.quitOnArguments = importRecipes(args) > 0 || configs.quitOnArguments;
        configs.quitOnArguments = importLangs(args) > 0 || configs.quitOnArguments;
        if (args.includes('--help') || args.includes('-h')) {
            console.info(format(trans.helpUsage, program));
            console.info(trans.helpWhere);
            console.info(trans.helpWhereDescription);
            configs.quitOnArguments = true;
        }
        if (configs.quitOnArguments) {
            app.quit();
        }
        configs.relaunchOnNeed = true;
    }
};
const loadFileFilters = (reload = false) => {
    if (reload && recipeFileFilters.length > 0 && langFileFilters.length > 0) {
        recipeFileFilters[0].name = `${trans.recipeFile} (*.${extension()})`;
        langFileFilters[0].name = `${trans.langFile} (*.${extension('lang')})`;
    } else {
        recipeFileFilters.push(
            {
                name: `${trans.recipeFile} (*.urmrecipe)`,
                extensions: ['urmrecipe']
            }
        );
        langFileFilters.push(
            {
                name: `${trans.langFile} (*.urmlang)`,
                extensions: ['urmlang']
            }
        );
    }
};
const loadLocale = () => {
    const l = lang();
    const t = (l !== null ? JSON.parse(fs.readFileSync(l).toString()) : {});
    Object.assign(trans, t);
};
const importLangs = (file = null) => {
    const files = file ? (typeof file === 'string' ? [file] : file) : (dialog.showOpenDialogSync(win, {
        title: trans.langImport,
        defaultPath: homedir(),
        properties: ['openFile', 'multiSelections'],
        filters: langFileFilters.slice()
    }) || []);
    const effectiveFiles = files.filter(f => f.endsWith(extension('lang')));
    if (effectiveFiles.length > 0) {
        effectiveFiles.forEach((file, index) => {
            const base = path.basename(file);
            const dest = path.resolve(transDir, base);
            if (!configs.replaceLangIfExists && fs.existsSync(dest)) {
                if (configs.skipLangIfExists) {
                    return;
                }
                const action = dialog.showMessageBoxSync(win, {
                    title: trans.langFound,
                    message: format(trans.langExists, base),
                    buttons: [trans.replace, trans.replaceAll, trans.skip, trans.skipAll]
                });
                if (action === 3) {
                    configs.skipLangIfExists = true;
                    configs.relaunchOnNeed = configs.relaunchOnNeed && files.length > 1 && index !== files.length - 1;
                    return;
                } else if (action === 2) {
                    configs.relaunchOnNeed = configs.relaunchOnNeed && files.length > 1;
                    return;
                } else if (action === 1) {
                    configs.replaceLangIfExists = true;
                }
            }
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, dest);
            }
        });
        configs.skipLangIfExists = false;
        configs.replaceLangIfExists = false;
        if (configs.relaunchOnNeed) {
            app.relaunch();
            app.exit();
        }
        configs.relaunchOnNeed = true;
    }
    return effectiveFiles.length;
};
const format = (fmt, ...values) => {
    return fmt.replace(/{(\d+)}/g, (match, index) => typeof values[index] !== 'undefined' ? values[index] : match);
};
const lang = () => {
    const env = process.env;
    const locale = configs.lang || env.LC_CTYPE || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
    const lang = (locale ? locale.split(/([_.])/g)[0] : 'en');
    if (!fs.existsSync(transDir)) {
        fs.mkdirSync(transDir, {recursive: true});
    }
    const file = path.resolve(transDir, `${lang}.${extension('lang')}`);
    if (fs.existsSync(file)) {
        return file;
    } else {
        return null;
    }
};
const createMenu = () => {
    const menu = new Menu();
    const file = new MenuItem({
        role: 'fileMenu',
        submenu: [
            {
                label: trans.newWindow,
                accelerator: 'CommandOrControl+N',
                enabled: false,
                acceleratorWorksWhenHidden: false,
                registerAccelerator: true,
                click: (mi) => {
                    createWindow();
                    mi.enabled = false;
                }
            },
            {
                label: trans.close,
                role: 'close'
            },
            {
                label: trans.langImport,
                click: () => importLangs()
            },
            {
                label: trans.lang,
                submenu: fs.readdirSync(transDir)
                    .concat(`en.${extension('lang')}`)
                    .filter(f => f.endsWith(extension('lang')))
                    .map(t => {
                        const l = t.split('.')[0];
                        return {
                            label: `${l}`,
                            click: () => {
                                if (configs.lang !== l) {
                                    configs.lang = l;
                                    saveConfigs();
                                    if (configs.relaunchOnNeed) {
                                        app.relaunch();
                                        app.exit();
                                    }
                                }
                            }
                        };
                    })
            },
            {
                label: trans.quit,
                role: 'quit'
            }
        ]
    });
    if (process.platform !== 'darwin') {
        file.submenu.items = file.submenu.items.filter(smi => smi.label !== trans.newWindow);
    }
    file.submenu.items = file.submenu.items.sort((mia, mib) => {
        mia.label.toLowerCase().localeCompare(mib.label.toLowerCase());
    });
    menu.append(file);
    return menu;
};
const createWindow = () => {
    win = new BrowserWindow({
        width: 640,
        height: 480,
        icon: path.resolve(__dirname, 'build', 'icon.png'),
        autoHideMenuBar: false,
        webPreferences: {
            devTools: process.env.DEV_TOOLS,
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            preload: path.resolve(__dirname, 'src', 'preload.js')
        }
    });

    Menu.setApplicationMenu(createMenu());

    if (process.env.DEV_TOOLS) {
        win.webContents.openDevTools();
    }

    win.loadFile(path.resolve(__dirname, 'dist', 'index.html'));

    return win;
};
const loadConfigs = () => {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }
    const file = path.resolve(configDir, 'configs.json');
    if (fs.existsSync(file)) {
        const json = JSON.parse(fs.readFileSync(file).toString());
        for (const key in json) {
            configs[key] = json[key];
        }
    }
};
const saveConfigs = () => {
    fs.writeFileSync(path.resolve(configDir, 'configs.json'), JSON.stringify(configs), {flag: 'w'});
};
const importRecipes = (file = null) => {
    const files = file ? (typeof file === 'string' ? [file] : file) : (dialog.showOpenDialogSync(win, {
        title: trans.recipeSelect,
        defaultPath: homedir(),
        properties: ['openFile', 'multiSelections'],
        filters: recipeFileFilters.slice()
    }) || []);
    const effectiveFiles = files.filter(f => f.endsWith(extension()));
    if (effectiveFiles.length > 0) {
        effectiveFiles.forEach(file => {
            const base = path.basename(file);
            const dest = path.resolve(configDir, base);
            if (!configs.replaceRecipeIfExists && fs.existsSync(dest)) {
                if (configs.skipRecipeIfExists) {
                    return;
                }
                const action = dialog.showMessageBoxSync(win, {
                    title: trans.recipeFound,
                    message: format(trans.recipeExists, base),
                    buttons: [trans.replace, trans.replaceAll, trans.skip, trans.skipAll]
                });
                if (action === 3) {
                    configs.skipRecipeIfExists = true;
                    return;
                } else if (action === 2) {
                    return;
                } else if (action === 1) {
                    configs.replaceRecipeIfExists = true;
                }
            }
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, dest);
            }
        });
    }
    return effectiveFiles.length;
};

// App related
app.on('open-file', (e, path) => {
    e.preventDefault();
    app.on('ready', () => {
        path = path || process.argv.slice(1);
        importLangs(path);
        importRecipes(path);
    });
});

app.on('ready', () => {
    loadConfigs();
    loadFileFilters();
    loadLocale();
    checkUpdates();
    loadFileFilters(true);
    manageCLIArguments();
    if (!configs.quitOnArguments) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    saveConfigs();
    if (process.platform !== 'darwin' || process.env.DEV_TOOLS) {
        app.exit();
    }
    Menu.getApplicationMenu().items.filter(mi => mi.role.toLowerCase() === 'filemenu').forEach(mi => {
        mi.submenu.items.filter(smi => smi.label === trans.newWindow).forEach(smi => {
            smi.enabled = true;
        });
    });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ipcMain related

ipcMain.on('recipe:import', (e) => {
    e.returnValue = importRecipes();
});

ipcMain.on('recipe:all', (e) => {
    const files = fs.readdirSync(configDir);

    e.returnValue = files.filter(file => file.endsWith(extension()))
        .map(file => {
            const res = JSON.parse(fs.readFileSync(path.resolve(configDir, file)).toString());
            res.file = file;
            res.amount = 1;
            return res;
        });
});

ipcMain.on('recipe:create', (e, data) => {
    const name = JSON.parse(data).output.toLowerCase().replaceAll(' ', '_');
    const ext = extension();
    const file = dialog.showSaveDialogSync(win, {
        title: trans.recipeSave,
        properties: ['showOverwriteConfirmation'],
        defaultPath: path.resolve(configDir, `${name}.${ext}`),
        filters: recipeFileFilters.slice()
    });
    if (file) {
        let recipe = file;
        if (!recipe.endsWith(ext)) {
            recipe = `${recipe}.${ext}`;
        }
        fs.writeFileSync(recipe, data, {flag: 'w'});
        e.returnValue = 1;
    } else {
        e.returnValue = 0;
    }
});

ipcMain.on('recipe:update', (e, file, data) => {
    fs.writeFileSync(path.resolve(configDir, file), data, {flag: 'w'});
    e.returnValue = 1;
});

ipcMain.on('recipe:delete', (e, file) => {
    const recipe = path.resolve(configDir, file);
    if (fs.existsSync(recipe)) {
        const action = (!configs.askWhenDelete ? 0 : dialog.showMessageBoxSync(win, {
            title: trans.recipeDelete,
            message: format(trans.recipeConfirm, file),
            buttons: [trans.yes, trans.no, trans.dontAskAgain]
        }));
        if (action !== 1) {
            fs.rmSync(recipe);
            if (action === 3) {
                configs.askWhenDelete = false;
            }
        }
        e.returnValue = action;
    } else {
        e.returnValue = 0;
    }
});

ipcMain.on('recipe:read', (e, file) => {
    const recipe = path.resolve(configDir, file);
    if (fs.existsSync(recipe)) {
        const res = JSON.parse(fs.readFileSync(recipe).toString());
        res.file = file;
        e.returnValue = res;
    } else {
        e.returnValue = {
            file: `null.${extension()}`,
            output: '',
            quantity: 1,
            inputs: []
        };
    }
});

ipcMain.on('trans', (e) => {
    e.returnValue = trans;
});