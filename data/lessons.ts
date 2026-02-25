
import { Lesson, UserRole, UserSpecialization, ExerciseType } from '../types';

export const INITIAL_LESSONS: Lesson[] = [
  // --- РАЗРАБОТЧИК: УРОВЕНЬ 1 (ОБЩАЯ) ---
  {
    id: 'dev-l1-common',
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    level: 1,
    title: 'Основы платформы 1С',
    narrative: 'Добро пожаловать в мир 1С! Давай разберемся с базовыми понятиями метаданных и среды разработки.',
    exercises: [
      { id: 'd1-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Объект метаданных" в 1C?', options: ['Код процедуры', 'Элемент конфигурации (справочник, документ)', 'База данных', 'Форма ввода'], correctAnswer: 'Элемент конфигурации (справочник, документ)', explanation: 'Метаданные описывают структуру данных: справочники, документы, регистры.', xp: 10 },
      { id: 'd1-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Назовите типы модулей в 1C.', options: ['Только клиентский', 'Общий, формы, объекта', 'Серверный', 'Базовый'], correctAnswer: 'Общий, формы, объекта', explanation: 'В 1С используется модульная структура для разделения логики.', xp: 10 },
      { id: 'd1-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что делает директива &НаСервере?', options: ['Клиентский код', 'Выполнение на сервере', 'Оффлайн', 'Мобильный'], correctAnswer: 'Выполнение на сервере', explanation: 'Директивы компиляции управляют местом исполнения кода.', xp: 10 },
      { id: 'd1-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Реквизит"?', options: ['Кнопка формы', 'Свойство объекта для хранения данных', 'Запрос', 'Отчет'], correctAnswer: 'Свойство объекта для хранения данных', explanation: 'Реквизиты — это "поля" объекта, в которых хранятся значения.', xp: 10 },
      { id: 'd1-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Какой язык используется в 1C?', options: ['SQL', 'Встроенный язык 1C', 'JavaScript', 'Python'], correctAnswer: 'Встроенный язык 1C', explanation: '1С имеет собственный объектно-ориентированный язык программирования.', xp: 10 },
      { id: 'd1-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Конфигурация"?', options: ['Документ', 'Набор объектов метаданных', 'Пользователь', 'Роль'], correctAnswer: 'Набор объектов метаданных', explanation: 'Конфигурация — это проект всей информационной системы.', xp: 10 },
      { id: 'd1-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Назовите IDE для 1C.', options: ['Visual Studio', 'Конфигуратор', 'Eclipse', 'VS Code'], correctAnswer: 'Конфигуратор', explanation: 'Конфигуратор (или 1C:Enterprise Development Tools) — основная среда разработки.', xp: 10 },
      { id: 'd1-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Форма"?', options: ['Таблица', 'Визуальный интерфейс объекта', 'Запрос', 'Регистр'], correctAnswer: 'Визуальный интерфейс объекта', explanation: 'Формы отвечают за взаимодействие пользователя с данными.', xp: 10 },
      { id: 'd1-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что делает "Обновить интерфейс"?', options: ['Очистка данных', 'Перезагрузка команд и панелей', 'Закрытие формы', 'Сохранение'], correctAnswer: 'Перезагрузка команд и панелей', explanation: 'Используется для динамического изменения состава меню и панелей.', xp: 10 },
      { id: 'd1-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Табличная часть"?', options: ['Кнопка', 'Таблица в объекте', 'Отчет', 'Модуль'], correctAnswer: 'Таблица в объекте', explanation: 'Позволяет хранить списки связанных данных внутри одного документа или справочника.', xp: 10 }
    ]
  },
  // --- РАЗРАБОТЧИК: УРОВЕНЬ 2 (ОБЩАЯ) ---
  {
    id: 'dev-l2-common',
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    level: 2,
    title: 'Программирование и синтаксис',
    narrative: 'Переходим к практике! Изучаем переменные, циклы и встроенные функции.',
    exercises: [
      { id: 'd2-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как объявить переменную?', options: ['Var', 'Перем ИмяПеременной', 'Let', 'Dim'], correctAnswer: 'Перем ИмяПеременной', explanation: 'Ключевое слово "Перем" используется для объявления переменных.', xp: 15 },
      { id: 'd2-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что возвращает "ТипЗнч()"?', options: ['Значение', 'Тип значения', 'Длина', 'Дата'], correctAnswer: 'Тип значения', explanation: 'Функция возвращает объект типа "Тип" для переданного значения.', xp: 15 },
      { id: 'd2-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как реализовать цикл по массиву?', options: ['While', 'Для Каждого Элемент Из Массив Цикл', 'For i=0', 'Repeat'], correctAnswer: 'Для Каждого Элемент Из Массив Цикл', explanation: 'Это наиболее удобный способ обхода коллекций в 1С.', xp: 15 },
      { id: 'd2-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "Сообщить()"?', options: ['Ошибка', 'Вывод сообщения пользователю', 'Запись в лог', 'Уведомление'], correctAnswer: 'Вывод сообщения пользователю', explanation: 'Выводит текстовую строку в окно сообщений.', xp: 15 },
      { id: 'd2-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как получить текущую дату?', options: ['Now()', 'ТекущаяДата()', 'Date()', 'Today()'], correctAnswer: 'ТекущаяДата()', explanation: 'Возвращает дату и время сервера (или клиента).', xp: 15 },
      { id: 'd2-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что делает "НайтиПоРеквизиту"?', options: ['Сортировка', 'Поиск в табличной части', 'Удаление', 'Добавление'], correctAnswer: 'Поиск в табличной части', explanation: 'Метод используется для поиска строк в таблицах по значению колонки.', xp: 15 },
      { id: 'd2-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как обработать исключение?', options: ['If Error', 'Попытка... Исключение', 'Try Catch', 'On Error'], correctAnswer: 'Попытка... Исключение', explanation: 'Конструкция для перехвата рантайм-ошибок.', xp: 15 },
      { id: 'd2-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "ЗначениеЗаполнено"?', options: ['Пустая строка', 'Проверка на заполненность', 'Нулевое', 'Истина'], correctAnswer: 'Проверка на заполненность', explanation: 'Универсальная функция для проверки на "пустое" значение любого типа.', xp: 15 },
      { id: 'd2-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как создать запрос?', options: ['New Query', 'Запрос = Новый Запрос', 'Query.New', 'CreateQuery'], correctAnswer: 'Запрос = Новый Запрос', explanation: 'Запросы в 1С создаются как объекты встроенного языка.', xp: 15 },
      { id: 'd2-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что возвращает "Новый Структура"?', options: ['Массив', 'Пустую структуру', 'Таблицу', 'Запрос'], correctAnswer: 'Пустую структуру', explanation: 'Структура — это коллекция пар Ключ-Значение.', xp: 15 }
    ]
  },
  // --- РАЗРАБОТЧИК: УРОВЕНЬ 3 (ОБЩАЯ) ---
  {
    id: 'dev-l3-common',
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    level: 3,
    title: 'Язык запросов 1С',
    narrative: 'Запросы — сердце 1С. Научимся эффективно извлекать данные из базы.',
    exercises: [
      { id: 'd3-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Простой запрос выборки.', options: ['SELECT * FROM', 'ВЫБРАТЬ * ИЗ Справочник.Номенклатура', 'GET *', 'FETCH'], correctAnswer: 'ВЫБРАТЬ * ИЗ Справочник.Номенклатура', explanation: 'Язык запросов 1С похож на SQL, но использует кириллицу (или латиницу).', xp: 20 },
      { id: 'd3-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое "ПОМЕСТИТЬ"?', options: ['Удаление', 'Временная таблица', 'Экспорт', 'Импорт'], correctAnswer: 'Временная таблица', explanation: 'Ключевое слово для создания временных таблиц в менеджере временных таблиц.', xp: 20 },
      { id: 'd3-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как рассчитать итоги по полю?', options: ['SUM', 'ИТОГИ СУММА(Сумма) ПО ОБЩИЕ', 'GROUP', 'TOTAL'], correctAnswer: 'ИТОГИ СУММА(Сумма) ПО ОБЩИЕ', explanation: 'Секция ИТОГИ позволяет строить иерархические отчеты в запросе.', xp: 20 },
      { id: 'd3-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как указать параметр в запросе?', options: ['%param', '&Параметр', ':param', '@param'], correctAnswer: '&Параметр', explanation: 'Параметры в тексте запроса начинаются с символа амперсанда.', xp: 20 },
      { id: 'd3-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как выполнить объединение таблиц?', options: ['JOIN', 'ОБЪЕДИНИТЬ ВСЕ', 'UNION ALL', 'MERGE'], correctAnswer: 'ОБЪЕДИНИТЬ ВСЕ', explanation: 'Используется для сложения результатов двух запросов.', xp: 20 },
      { id: 'd3-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Фильтр по дате в запросе.', options: ['Date =', 'Дата >= &ДатаНачала', 'WHERE Date', 'FILTER Date'], correctAnswer: 'Дата >= &ДатаНачала', explanation: 'Условия задаются в секции ГДЕ.', xp: 20 },
      { id: 'd3-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как сгруппировать данные?', options: ['SORT', 'СГРУППИРОВАТЬ ПО Поле', 'GROUP BY', 'AGGREGATE'], correctAnswer: 'СГРУППИРОВАТЬ ПО Поле', explanation: 'СГРУППИРОВАТЬ ПО используется для агрегации данных.', xp: 20 },
      { id: 'd3-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как упорядочить результат?', options: ['SORT BY', 'УПОРЯДОЧИТЬ ПО Поле', 'ORDER', 'RANK'], correctAnswer: 'УПОРЯДОЧИТЬ ПО Поле', explanation: 'УПОРЯДОЧИТЬ ПО задает сортировку выборки.', xp: 20 },
      { id: 'd3-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Левое соединение таблиц.', options: ['INNER', 'ЛЕВОЕ СОЕДИНЕНИЕ', 'RIGHT', 'FULL'], correctAnswer: 'ЛЕВОЕ СОЕДИНЕНИЕ', explanation: 'Позволяет получить все данные из левой таблицы и совпадения из правой.', xp: 20 },
      { id: 'd3-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как получить остатки в запросе?', options: ['Balance', '.Остатки()', 'Remains', 'Stock'], correctAnswer: '.Остатки()', explanation: 'Запрос к виртуальной таблице Остатки регистров накопления.', xp: 20 }
    ]
  },
  // --- РАЗРАБОТЧИК: УРОВЕНЬ 4 (ОБЩАЯ) ---
  {
    id: 'dev-l4-common',
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    level: 4,
    title: 'Управляемые формы и UI',
    narrative: 'Создаем удобный интерфейс. Работаем с событиями форм и динамическими списками.',
    exercises: [
      { id: 'd4-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Событие формы при открытии.', options: ['OnLoad', 'ПриОткрытии', 'Open', 'Init'], correctAnswer: 'ПриОткрытии', explanation: 'Обработчик, вызываемый в момент инициализации формы на клиенте.', xp: 25 },
      { id: 'd4-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как передать параметр в форму?', options: ['Form.Params', 'Параметры.<Имя>', 'Args', 'Input'], correctAnswer: 'Параметры.<Имя>', explanation: 'Доступ к параметрам осуществляется через коллекцию Параметры.', xp: 25 },
      { id: 'd4-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Обработчик нажатия кнопки.', options: ['Click', 'Нажатие', 'Press', 'Action'], correctAnswer: 'Нажатие', explanation: 'Основное событие команды формы.', xp: 25 },
      { id: 'd4-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как программно установить отбор в динамическом списке?', options: ['Filter.Add', 'Список.Отбор.Элементы.Очистить(); ...', 'List.Filter', 'Query.Filter'], correctAnswer: 'Список.Отбор.Элементы.Очистить(); ...', explanation: 'Нужно работать с коллекцией Элементы отбора динамического списка.', xp: 25 },
      { id: 'd4-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как вызвать модальное окно вопроса?', options: ['Alert', 'ПоказатьВопрос', 'Dialog', 'ShowModal'], correctAnswer: 'ПоказатьВопрос', explanation: 'В управляемом интерфейсе используется асинхронный метод ПоказатьВопрос.', xp: 25 },
      { id: 'd4-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как задать значение реквизита по умолчанию?', options: ['Default', 'ЭтотОбъект.<Реквизит> = Значение', 'SetDefault', 'InitValue'], correctAnswer: 'ЭтотОбъект.<Реквизит> = Значение', explanation: 'Обычно делается в событии ПриСозданииНаСервере.', xp: 25 },
      { id: 'd4-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Обновление данных формы из базы.', options: ['Refresh', 'ЭтотОбъект.Прочитать()', 'Reload', 'Update'], correctAnswer: 'ЭтотОбъект.Прочитать()', explanation: 'Метод перечитывает объект из базы данных.', xp: 25 },
      { id: 'd4-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое Условное оформление?', options: ['Style', 'УсловноеОформление', 'Condition', 'Format'], correctAnswer: 'УсловноеОформление', explanation: 'Позволяет менять цвет или видимость элементов в зависимости от условий без кода.', xp: 25 },
      { id: 'd4-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Закрытие формы с возвратом результата.', options: ['Exit', 'Закрыть(Результат)', 'CloseForm', 'End'], correctAnswer: 'Закрыть(Результат)', explanation: 'Метод Закрыть() может принимать необязательный параметр — результат закрытия.', xp: 25 },
      { id: 'd4-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как запустить код по таймеру в форме?', options: ['Timer', 'ПодключитьОбработчикОжидания', 'Schedule', 'Delay'], correctAnswer: 'ПодключитьОбработчикОжидания', explanation: 'Метод позволяет вызвать процедуру через заданный интервал.', xp: 25 }
    ]
  },
  // --- РАЗРАБОТЧИК: УРОВЕНЬ 5 (ОБЩАЯ) ---
  {
    id: 'dev-l5-common',
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    level: 5,
    title: 'Продвинутая разработка и регистры',
    narrative: 'Мастерство 1С: сложные запросы, транзакции и работа с регистрами.',
    exercises: [
      { id: 'd5-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Запрос остатков регистра накопления.', options: ['Select Balance', 'РегистрНакопления.ТоварыНаСкладах.Остатки( , Склад = &Склад)', 'StockQuery', 'Remains()'], correctAnswer: 'РегистрНакопления.ТоварыНаСкладах.Остатки( , Склад = &Склад)', explanation: 'Используются виртуальные таблицы регистров.', xp: 30 },
      { id: 'd5-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как создать движение по регистру в документе?', options: ['AddRecord', 'Движения.<Регистр>.Добавить(); ...', 'Movement', 'Post'], correctAnswer: 'Движения.<Регистр>.Добавить(); ...', explanation: 'Движения записываются при проведении документа.', xp: 30 },
      { id: 'd5-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Срез последних в периодическом регистре сведений.', options: ['Last', 'РегистрСведений.<Имя>.СрезПоследних(Дата)', 'Slice', 'PeriodEnd'], correctAnswer: 'РегистрСведений.<Имя>.СрезПоследних(Дата)', explanation: 'Позволяет получить актуальные данные на определенный момент времени.', xp: 30 },
      { id: 'd5-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как управлять транзакцией в коде?', options: ['Transaction', 'НачатьТранзакцию(); ... ЗафиксироватьТранзакцию()', 'Commit', 'Rollback'], correctAnswer: 'НачатьТранзакцию(); ... ЗафиксироватьТранзакцию()', explanation: 'Транзакции гарантируют целостность данных при записи.', xp: 30 },
      { id: 'd5-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Методы оптимизации запросов.', options: ['Indexes', 'Индексы, ПОМЕСТИТЬ', 'Optimize', 'Cache'], correctAnswer: 'Индексы, ПОМЕСТИТЬ', explanation: 'Использование индексов и временных таблиц ускоряет работу с БД.', xp: 30 },
      { id: 'd5-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое RLS в 1C?', options: ['Row Level Security', 'Ограничение на уровне записей', 'Filter', 'Access'], correctAnswer: 'Ограничение на уровне записей', explanation: 'Механизм разграничения прав доступа к конкретным строкам таблиц.', xp: 30 },
      { id: 'd5-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как программно вызвать внешнюю обработку?', options: ['External', 'ОбработкаОбъект = Обработки.<Имя>.Создать()', 'Plugin', 'Script'], correctAnswer: 'ОбработкаОбъект = Обработки.<Имя>.Создать()', explanation: 'Позволяет подключать внешние инструменты.', xp: 30 },
      { id: 'd5-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое расширение конфигурации?', options: ['Extension', 'Подписка на события', 'Update', 'Patch'], correctAnswer: 'Подписка на события', explanation: 'Расширения позволяют менять логику типовых конфигураций без снятия с поддержки.', xp: 30 },
      { id: 'd5-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Механизм обмена данными в 1С.', options: ['Sync', 'ПланОбмена.<Имя>', 'Exchange', 'Import'], correctAnswer: 'ПланОбмена.<Имя>', explanation: 'Планы обмена отслеживают изменения для синхронизации баз.', xp: 30 },
      { id: 'd5-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Как повысить производительность системы?', options: ['Speed', 'Служебные вызовы минимизировать', 'Perf', 'OptimizeCalls'], correctAnswer: 'Служебные вызовы минимизировать', explanation: 'Уменьшение количества обращений клиента к серверу — залог скорости.', xp: 30 }
    ]
  },

  // --- БУХГАЛТЕР: УРОВЕНЬ 1 (1С:БУХГАЛТЕРИЯ) ---
  {
    id: 'acc-l1-acc',
    role: UserRole.ACCOUNTANT,
    specialization: UserSpecialization.ACC,
    level: 1,
    title: 'Основы бухгалтерского учета',
    narrative: 'Начнем с азов: счета, проводки и базовые документы.',
    exercises: [
      { id: 'b1-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое проводка?', options: ['Отчет', 'Дт и Кт', 'Документ', 'Справочник'], correctAnswer: 'Дт и Кт', explanation: 'Проводка отражает движение средств между дебетом одного счета и кредитом другого.', xp: 10 },
      { id: 'b1-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'Основной счет кассы?', options: ['50', '10', '62', '91'], correctAnswer: '50', explanation: 'Согласно плану счетов, 50 — это Касса.', xp: 10 },
      { id: 'b1-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Для чего нужен справочник контрагентов?', options: ['Товары', 'Для клиентов/поставщиков', 'Счета', 'Договоры'], correctAnswer: 'Для клиентов/поставщиков', explanation: 'Там хранятся все сторонние организации и физлица.', xp: 10 },
      { id: 'b1-4', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое НДС?', options: ['Прибыль', 'Налог на добавленную стоимость', 'ОСNO', 'ФОТ'], correctAnswer: 'Налог на добавленную стоимость', explanation: 'Косвенный налог, включаемый в стоимость товаров.', xp: 10 },
      { id: 'b1-5', type: ExerciseType.MULTIPLE_CHOICE, question: 'Документ счет-фактура нужен?', options: ['Платеж', 'Для НДС', 'Накладная', 'Акт'], correctAnswer: 'Для НДС', explanation: 'Служит основанием для принятия НДС к вычету.', xp: 10 },
      { id: 'b1-6', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое План счетов?', options: ['Товары', 'Табло счетов', 'Клиенты', 'Отчеты'], correctAnswer: 'Табло счетов', explanation: 'Система группировки счетов бухгалтерского учета.', xp: 10 },
      { id: 'b1-7', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что означает аббревиатура ОС?', options: ['Товары', 'Основные средства', 'Материалы', 'Деньги'], correctAnswer: 'Основные средства', explanation: 'Средства труда со сроком использования более года.', xp: 10 },
      { id: 'b1-8', type: ExerciseType.MULTIPLE_CHOICE, question: 'Авансовый отчет отражает?', options: ['Поступление', 'Расходы сотрудника', 'Реализация', 'Списание'], correctAnswer: 'Расходы сотрудника', explanation: 'Оправдательные документы по тратам подотчетных лиц.', xp: 10 },
      { id: 'b1-9', type: ExerciseType.MULTIPLE_CHOICE, question: 'Закрытие месяца — это?', options: ['Документы', 'Регламентные операции', 'Справочники', 'Отчеты'], correctAnswer: 'Регламентные операции', explanation: 'Автоматический расчет итогов и финрезультата.', xp: 10 },
      { id: 'b1-10', type: ExerciseType.MULTIPLE_CHOICE, question: 'Бухгалтерский учет базируется на?', options: ['Единая запись', 'Двойная запись', 'Тройная', 'Без записи'], correctAnswer: 'Двойная запись', explanation: 'Принцип равенства Дебета и Кредита.', xp: 10 }
    ]
  },

  // --- БУХГАЛТЕР: УРОВЕНЬ 2 (1С:БУХГАЛТЕРИЯ) ---
  {
    id: 'acc-l2-acc',
    role: UserRole.ACCOUNTANT,
    specialization: UserSpecialization.ACC,
    level: 2,
    title: 'Товарный учет и расчеты',
    narrative: 'Разбираемся с закупками, продажами и взаиморасчетами.',
    exercises: [
      { id: 'b2-1', type: ExerciseType.MULTIPLE_CHOICE, question: 'Каким документом оформляется поступление товаров?', options: ['Реализация', 'Поступление товаров и услуг', 'Счет на оплату', 'ПКО'], correctAnswer: 'Поступление товаров и услуг', explanation: 'Основной документ для оприходования ТМЦ.', xp: 15 },
      { id: 'b2-2', type: ExerciseType.MULTIPLE_CHOICE, question: 'На каком счету учитываются товары на складе?', options: ['41', '10', '60', '01'], correctAnswer: '41', explanation: 'Счет 41 — Товары.', xp: 15 },
      { id: 'b2-3', type: ExerciseType.MULTIPLE_CHOICE, question: 'Что такое ОСВ?', options: ['Очень Срочный Вопрос', 'Оборотно-сальдовая ведомость', 'Отчет Состояния Выручки', 'Общая Сумма Выплат'], correctAnswer: 'Оборотно-сальдовая ведомость', explanation: 'Один из главных бухгалтерских отчетов.', xp: 15 }
    ]
  },

  // --- АДМИНИСТРАТОР: УРОВЕНЬ 1 (ОБЩАЯ) ---
  {
    id: 'admin-l1-common',
    role: UserRole.ADMINISTRATOR,
    specialization: UserSpecialization.COMMON,
    level: 1,
    title: 'Основы администрирования',
    narrative: 'Новый сервер прибыл. Начни с базовой настройки информационной базы и кластера.',
    exercises: [
      {
        id: 'admin-l1-ex1',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'Какая утилита используется для администрирования кластера серверов 1С?',
        options: [
          'Консоль администрирования серверов 1С:Предприятия',
          'Диспетчер задач Windows',
          'Блокнот',
          'SQL Management Studio'
        ],
        correctAnswer: 'Консоль администрирования серверов 1С:Предприятия',
        explanation: 'Специальная оснастка (MMC) для управления процессами, базами и сеансами.',
        xp: 15
      },
      {
        id: 'admin-l1-ex2',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'Что такое файл 1cv8.1cd?',
        options: [
          'Лог-файл сервера',
          'Файл файловой базы данных',
          'Исполняемый файл платформы',
          'Конфигурационный файл'
        ],
        correctAnswer: 'Файл файловой базы данных',
        explanation: 'В файловом варианте работы вся база хранится в одном этом файле.',
        xp: 15
      }
    ]
  }
];
