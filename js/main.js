// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Регистрация генераторов происходит в их собственных файлах,
    // которые подключаются в HTML до main.js
    console.log("Available generators:", GeneratorRegistry.getAllGenerators());

    // Инициализация UI (заполнит селект генераторов, привяжет события)
    UI.init();

    // Можно добавить логику для загрузки последнего состояния из localStorage,
    // если это необходимо.
});
