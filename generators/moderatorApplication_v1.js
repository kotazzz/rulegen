const moderatorApplicationGenerator = {
    id: "moderatorApplication_v1",
    name: "Заявка на модератора v1",
    description: "Генерирует шаблон заявки на должность модератора.",
    version: "1.0",
    
    // Структура документа (добавлена для совместимости с движком)
    structure: {
        introModuleId: 'mod-app-intro',
    },
    
    // Секции с настройками
    sections: [
        {
            id: 'appCustomization',
            title: 'Настройки заявки',
            icon: 'fas fa-user-shield',
            type: 'multi-choice-checkboxes',
            options: [
                { value: 'includeAge', label: 'Указывать возраст', icon: 'fas fa-birthday-cake', checked: true },
                { value: 'includeTimezone', label: 'Указывать часовой пояс', icon: 'fas fa-clock', checked: true },
                { value: 'includeExperience', label: 'Указывать опыт модерирования', icon: 'fas fa-chart-line', checked: true },
                { value: 'includeMotivation', label: 'Указывать мотивацию', icon: 'fas fa-exclamation', checked: true }
            ]
        }
    ],
    
    // Модули заявки
    ruleModules: [
        {
            id: 'mod-app-intro',
            name: 'Введение заявки',
            type: 'intro',
            defaultEnabled: true,
            textTemplate: `# Заявка на модератора

**Основные данные:**`
        },
        {
            id: 'mod-app-nickname',
            name: 'Никнейм',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **Никнейм:** [Ваш никнейм]`
        },
        {
            id: 'mod-app-age',
            name: 'Возраст',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { 'appCustomization.includeAge': true },
            textTemplate: `*   **Возраст:** [Ваш возраст]`
        },
        {
            id: 'mod-app-timezone',
            name: 'Часовой пояс',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { 'appCustomization.includeTimezone': true },
            textTemplate: `*   **Часовой пояс/Местоположение:** [Ваш часовой пояс или город]`
        },
        {
            id: 'mod-app-contact',
            name: 'Контактная информация',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **Как с вами связаться (Discord/Telegram и т.п.):** [Контактная информация]`
        },
        {
            id: 'mod-app-experience-section',
            name: 'Раздел опыта',
            type: 'intro',
            defaultEnabled: true,
            textTemplate: `\n**Опыт и мотивация:**`
        },
        {
            id: 'mod-app-experience',
            name: 'Опыт модерирования',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { 'appCustomization.includeExperience': true },
            textTemplate: `*   **Есть ли у вас опыт модерирования? Если да, опишите его:**
    [Ваш ответ]`
        },
        {
            id: 'mod-app-motivation',
            name: 'Мотивация',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { 'appCustomization.includeMotivation': true },
            textTemplate: `*   **Почему вы хотите стать модератором на нашем ресурсе?**
    [Ваш ответ]`
        },
        {
            id: 'mod-app-time',
            name: 'Доступное время',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **Сколько времени вы готовы уделять модерированию в неделю?**
    [Ваш ответ]`
        },
        {
            id: 'mod-app-online',
            name: 'Время онлайн',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **В какое время вы обычно онлайн?**
    [Ваш ответ]`
        },
        {
            id: 'mod-app-additional-section',
            name: 'Раздел дополнительно',
            type: 'intro',
            defaultEnabled: true,
            textTemplate: `\n**Дополнительно:**`
        },
        {
            id: 'mod-app-about',
            name: 'О себе',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **Расскажите немного о себе:**
    [Ваш ответ]`
        },
        {
            id: 'mod-app-rules',
            name: 'Согласие с правилами',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `*   **Согласны ли вы с правилами ресурса и обязуетесь ли их соблюдать?** (Да/Нет)`
        },
        {
            id: 'mod-app-date',
            name: 'Дата подачи',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `\n---\n*Дата подачи заявки: {{date}}*`
        }
    ],
    
    generate: function(options) {
        // Вставляем текущую дату
        options.date = new Date().toLocaleDateString();
        
        // Используем встроенный движок для генерации заявки на основе модулей и опций
        return RuleEngine.generate(this, options);
    }
};

// Регистрация генератора
GeneratorRegistry.register(moderatorApplicationGenerator);

