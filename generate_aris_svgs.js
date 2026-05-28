const fs = await import('node:fs');
const path = await import('node:path');

const outDir = path.join(nodeRepl.cwd, 'event_agency_aris_models');

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(text, maxChars = 18) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(x, y, text, maxChars, cls = 'label', lineHeight = 18) {
  const lines = wrapText(text, maxChars);
  const firstY = y - ((lines.length - 1) * lineHeight) / 2;
  return `<text class="${cls}" x="${x}" y="${firstY}">${lines.map((line, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`
  ).join('')}</text>`;
}

function svgShell(width, height, title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#9aa7c7" opacity="0.62"/>
    </pattern>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b8ff4b"/>
      <stop offset="48%" stop-color="#63dd08"/>
      <stop offset="100%" stop-color="#2e9d02"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd66a"/>
      <stop offset="55%" stop-color="#ffb018"/>
      <stop offset="100%" stop-color="#d27b00"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#68eff2"/>
      <stop offset="100%" stop-color="#18a9b7"/>
    </linearGradient>
    <linearGradient id="grayGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef7f5"/>
      <stop offset="100%" stop-color="#aebfbc"/>
    </linearGradient>
    <marker id="arrow" markerWidth="11" markerHeight="11" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L11,3.5 L0,7 Z" fill="#444"/>
    </marker>
    <style>
      .page { fill: #fff; }
      .title { font: 700 30px Arial, sans-serif; fill: #222; text-anchor: middle; }
      .subtitle { font: 400 16px Arial, sans-serif; fill: #555; text-anchor: middle; }
      .label { font: 700 15px Arial, sans-serif; fill: #111; text-anchor: middle; dominant-baseline: middle; }
      .small { font: 700 12px Arial, sans-serif; fill: #111; text-anchor: middle; dominant-baseline: middle; }
      .tiny { font: 700 10.5px Arial, sans-serif; fill: #111; text-anchor: middle; dominant-baseline: middle; }
      .line { stroke: #454545; stroke-width: 2.6; fill: none; marker-end: url(#arrow); }
      .linePlain { stroke: #454545; stroke-width: 2.6; fill: none; }
      .dash { stroke: #555; stroke-width: 2.2; fill: none; stroke-dasharray: 7 6; }
      .func { fill: url(#greenGrad); stroke: #42a90e; stroke-width: 2.8; filter: drop-shadow(3px 4px 2px rgb(0 0 0 / 0.23)); }
      .event { fill: url(#orangeGrad); stroke: #c57900; stroke-width: 2.8; filter: drop-shadow(3px 4px 2px rgb(0 0 0 / 0.23)); }
      .org { fill: url(#cyanGrad); stroke: #087d89; stroke-width: 2.6; rx: 7; ry: 7; filter: drop-shadow(3px 4px 2px rgb(0 0 0 / 0.21)); }
      .role { fill: #ffe56c; stroke: #c19b00; stroke-width: 2.4; rx: 7; ry: 7; filter: drop-shadow(3px 4px 2px rgb(0 0 0 / 0.18)); }
      .data { fill: url(#cyanGrad); stroke: #087d89; stroke-width: 2.6; rx: 7; ry: 7; filter: drop-shadow(3px 4px 2px rgb(0 0 0 / 0.21)); }
      .attr { fill: url(#grayGrad); stroke: #89a29d; stroke-width: 2; rx: 5; ry: 5; filter: drop-shadow(2px 3px 2px rgb(0 0 0 / 0.18)); }
      .xor { fill: #f6f6f6; stroke: #444; stroke-width: 2.8; }
      .legend { fill: #f8f8f8; stroke: #b8b8b8; stroke-width: 1.4; rx: 8; }
    </style>
  </defs>
  <rect class="page" width="${width}" height="${height}"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <text class="title" x="${width / 2}" y="42">${esc(title)}</text>
  ${body}
</svg>`;
}

function rect(x, y, w, h, text, cls = 'func', max = 18) {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>
${textBlock(x + w / 2, y + h / 2, text, max, w < 120 ? 'tiny' : 'small')}`;
}

function event(x, y, w, h, text, max = 18) {
  const p = [
    [x + 22, y], [x + w - 22, y], [x + w, y + h / 2],
    [x + w - 22, y + h], [x + 22, y + h], [x, y + h / 2]
  ].map(([a, b]) => `${a},${b}`).join(' ');
  return `<polygon class="event" points="${p}"/>
${textBlock(x + w / 2, y + h / 2, text, max, 'small')}`;
}

function chevron(x, y, w, h, text, max = 18) {
  const p = [
    [x, y], [x + w - 18, y], [x + w, y + h / 2],
    [x + w - 18, y + h], [x, y + h], [x + 18, y + h / 2]
  ].map(([a, b]) => `${a},${b}`).join(' ');
  return `<polygon class="func" points="${p}"/>
${textBlock(x + w / 2 + 4, y + h / 2, text, max, 'tiny', 14)}`;
}

function line(x1, y1, x2, y2, cls = 'line') {
  return `<path class="${cls}" d="M${x1} ${y1} L${x2} ${y2}"/>`;
}

function elbow(points, cls = 'line') {
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return `<path class="${cls}" d="${d}"/>`;
}

function orgChart() {
  let b = '';
  b += `<text class="subtitle" x="700" y="68">Organizational Chart: организационная структура event-агентства</text>`;
  b += rect(570, 95, 260, 62, 'Генеральный директор', 'org', 24);
  const depts = [
    [80, 245, 'Коммерческий отдел'],
    [315, 245, 'Проектный отдел'],
    [550, 245, 'Операционный отдел'],
    [785, 245, 'Финансово-юридический отдел'],
    [1020, 245, 'Маркетинг и PR'],
  ];
  b += line(700, 157, 700, 205, 'linePlain');
  b += line(170, 205, 1130, 205, 'linePlain');
  for (const [x, y, t] of depts) {
    b += line(x + 115, 205, x + 115, y, 'linePlain');
    b += rect(x, y, 230, 58, t, 'org', 22);
  }
  const roles = [
    [80, 340, 'Руководитель продаж'], [80, 420, 'Менеджер по клиентам'], [80, 500, 'CRM-специалист'],
    [315, 340, 'Руководитель проектов'], [315, 420, 'Event-менеджер'], [315, 500, 'Креативный продюсер'], [315, 580, 'Сценарист'], [315, 660, 'Дизайнер'],
    [550, 340, 'Технический продюсер'], [550, 420, 'Координатор площадки'], [550, 500, 'Логист'], [550, 580, 'Менеджер подрядчиков'],
    [785, 340, 'Финансовый менеджер'], [785, 420, 'Бухгалтер'], [785, 500, 'Юрист'],
    [1020, 340, 'SMM-специалист'], [1020, 420, 'PR-менеджер'], [1020, 500, 'Контент-менеджер'],
  ];
  for (const [x, y, t] of roles) {
    b += line(x + 115, y - 37, x + 115, y, 'linePlain');
    b += rect(x + 22, y, 186, 54, t, 'role', 18);
  }
  b += rect(550, 690, 230, 58, 'Внешние подрядчики', 'org', 22);
  b += elbow([[665, 634], [665, 690]], 'linePlain');
  [['Кейтеринг', 395], ['Оборудование', 535], ['Артисты', 675], ['Декор', 815], ['Фото / видео', 955]].forEach(([t, x]) => {
    b += line(665, 748, x + 60, 805, 'linePlain');
    b += rect(x, 805, 120, 48, t, 'role', 13);
  });
  b += `<rect class="legend" x="40" y="875" width="520" height="60"/>
${rect(62, 890, 70, 28, 'Org Unit', 'org', 10)}
${rect(252, 890, 70, 28, 'Position', 'role', 10)}
<text class="small" x="405" y="904">ARIS: Organizational Chart</text>`;
  return svgShell(1400, 960, 'Организационная модель event-агентства', b);
}

function processLandscape() {
  let b = '';
  b += `<text class="subtitle" x="800" y="68">Process Landscape / VACD: верхнеуровневые бизнес-процессы</text>`;
  b += chevron(555, 95, 490, 72, 'Работа с клиентом и организация мероприятия', 34);
  b += line(800, 167, 800, 220, 'linePlain');
  b += line(120, 220, 1480, 220, 'linePlain');
  const top = [
    [60, 'Продажи и CRM'],
    [265, 'Предпроектная подготовка'],
    [520, 'Договор и финансы'],
    [755, 'Планирование проекта'],
    [1000, 'Подготовка ресурсов'],
    [1240, 'Проведение и закрытие'],
  ];
  for (const [x, t] of top) {
    b += line(x + 105, 220, x + 105, 275, 'linePlain');
    b += chevron(x, 275, 210, 58, t, 19);
  }
  const subs = [
    [60, 380, ['Регистрация заявки', 'Квалификация лида', 'Назначение менеджера']],
    [265, 380, ['Анализ потребностей', 'Концепция и сценарий', 'Коммерческое предложение']],
    [520, 380, ['Расчет сметы', 'Согласование условий', 'Заключение договора']],
    [755, 380, ['План-график', 'Распределение задач', 'Контроль сроков']],
    [1000, 380, ['Подбор площадки', 'Закупка / аренда', 'Логистика и монтаж']],
    [1240, 380, ['Реализация сценария', 'Отчетность', 'Повторные продажи']],
  ];
  for (const [x, y, items] of subs) {
    items.forEach((t, i) => {
      b += line(x + 105, i === 0 ? 333 : y + i * 95 - 37, x + 105, y + i * 95, 'linePlain');
      b += chevron(x + 20, y + i * 95, 170, 54, t, 17);
    });
  }
  b += `<rect class="legend" x="50" y="710" width="560" height="66"/>
${chevron(70, 726, 110, 34, 'Process', 12)}
<text class="small" x="390" y="743">ARIS: Process Landscape / Value-added Chain</text>`;
  return svgShell(1600, 820, 'Бизнес-модель процессов event-агентства', b);
}

function dataModel() {
  const entities = [
    [65, 120, 'Клиенты', ['id_клиента', 'Название_компании', 'ФИО', 'Телефон', 'Email']],
    [285, 120, 'Мероприятия', ['id_мероприятия', 'id_клиента', 'id_менеджера', 'Дата_проведения', 'Место_проведения', 'Формат', 'Бюджет', 'Статус']],
    [540, 120, 'Ресурсы', ['id_ресурса', 'Тип_ресурса', 'Описание', 'Стоимость', 'Поставщик']],
    [760, 120, 'Подрядчики', ['id_подрядчика', 'Название', 'Тип_услуг', 'Контакт', 'Стоимость']],
    [1000, 120, 'Задачи проекта', ['id_задачи', 'id_мероприятия', 'id_сотрудника', 'Описание_задачи', 'Срок_выполнения', 'Статус']],
    [1245, 120, 'Сотрудники', ['id_сотрудника', 'ФИО', 'Должность', 'Телефон', 'Отдел']],
    [1480, 120, 'Документы', ['id_документа', 'id_мероприятия', 'Тип_документа', 'Дата', 'Статус']],
  ];
  let b = `<text class="subtitle" x="850" y="68">Data Model: сущности базы данных event-агентства</text>`;
  for (const [x, y, name, attrs] of entities) {
    b += rect(x, y, 155, 50, name, 'data', 16);
    attrs.forEach((a, i) => {
      const ay = y + 76 + i * 58;
      b += rect(x + 15, ay, 125, 40, a, 'attr', 16);
      b += line(x + 78, i === 0 ? y + 50 : ay - 18, x + 78, ay, 'linePlain');
    });
  }
  b += elbow([[220, 145], [255, 145], [255, 196], [285, 196]], 'linePlain');
  b += elbow([[440, 221], [510, 221], [510, 145], [540, 145]], 'linePlain');
  b += elbow([[440, 279], [970, 279], [970, 196], [1000, 196]], 'linePlain');
  b += elbow([[1155, 250], [1215, 250], [1215, 196], [1245, 196]], 'linePlain');
  b += elbow([[440, 337], [1450, 337], [1450, 196], [1480, 196]], 'linePlain');
  b += elbow([[695, 428], [745, 428], [745, 196], [760, 196]], 'linePlain');
  b += `<text class="tiny" x="250" y="130">1:N</text>
<text class="tiny" x="475" y="207">1:N</text>
<text class="tiny" x="955" y="265">1:N</text>
<text class="tiny" x="1205" y="236">N:1</text>
<text class="tiny" x="1430" y="322">1:N</text>
<rect class="legend" x="55" y="740" width="575" height="62"/>
${rect(77, 755, 80, 30, 'Entity', 'data', 10)}
${rect(260, 755, 85, 30, 'Attribute', 'attr', 10)}
<text class="small" x="465" y="770">ARIS: Data Model</text>`;
  return svgShell(1700, 840, 'Data Model «База данных event-агентства»', b);
}

function epcModel() {
  let b = `<text class="subtitle" x="800" y="68">EPC: основной процесс выполнения заказа мероприятия</text>`;
  const cx = 800;
  const steps = [
    ['event', 'Поступил запрос от клиента'],
    ['func', 'Принять заявку и зафиксировать в CRM'],
    ['event', 'Заявка зарегистрирована'],
    ['func', 'Назначить event-менеджера'],
    ['func', 'Выявить требования, бюджет и сроки'],
    ['event', 'Требования клиента определены'],
    ['func', 'Подготовить концепцию и смету'],
    ['event', 'Коммерческое предложение готово'],
    ['func', 'Согласовать предложение с клиентом'],
  ];
  let y = 95;
  let lastBottom = null;
  steps.forEach(([type, text], i) => {
    if (lastBottom !== null) b += line(cx, lastBottom, cx, y);
    if (type === 'event') {
      b += event(cx - 175, y, 350, 70, text, 27);
    } else {
      b += rect(cx - 180, y, 360, 62, text, 'func', 28);
    }
    if (i === 1) {
      b += rect(385, y + 4, 175, 54, 'Менеджер по клиентам', 'role', 18);
      b += rect(1040, y + 4, 175, 54, 'CRM', 'data', 12);
      b += line(560, y + 31, 620, y + 31, 'linePlain');
      b += line(980, y + 31, 1040, y + 31, 'linePlain');
    }
    if (i === 6) {
      b += rect(360, y + 4, 200, 54, 'Креативный продюсер', 'role', 18);
      b += rect(1040, y + 4, 190, 54, 'Шаблон сметы', 'data', 16);
      b += line(560, y + 31, 620, y + 31, 'linePlain');
      b += line(980, y + 31, 1040, y + 31, 'linePlain');
    }
    lastBottom = y + (type === 'event' ? 70 : 62);
    y += type === 'event' ? 105 : 98;
  });
  const diamondY = y - 12;
  b += line(cx, lastBottom, cx, diamondY);
  b += `<polygon class="xor" points="${cx},${diamondY} ${cx + 45},${diamondY + 45} ${cx},${diamondY + 90} ${cx - 45},${diamondY + 45}"/>
<text class="label" x="${cx}" y="${diamondY + 47}">XOR</text>
<text class="tiny" x="${cx - 72}" y="${diamondY + 37}">нет</text>
<text class="tiny" x="${cx + 78}" y="${diamondY + 37}">да</text>`;
  b += elbow([[cx - 45, diamondY + 45], [515, diamondY + 45], [515, 826], [620, 826]], 'line');
  b += rect(280, 794, 300, 62, 'Доработать предложение', 'func', 25);
  b += elbow([[430, 794], [430, 735], [620, 735]], 'line');
  b += elbow([[cx + 45, diamondY + 45], [980, diamondY + 45], [980, 970], [980, 970]], 'linePlain');
  const right = [
    ['func', 905, 970, 'Заключить договор'],
    ['event', 890, 1070, 'Договор подписан'],
    ['func', 905, 1175, 'Сформировать проектную команду'],
    ['func', 905, 1275, 'Закупить ресурсы и согласовать подрядчиков'],
    ['func', 905, 1375, 'Провести мероприятие'],
    ['event', 890, 1478, 'Мероприятие проведено'],
    ['func', 905, 1582, 'Подготовить отчет и закрывающие документы'],
    ['event', 890, 1685, 'Проект закрыт'],
  ];
  let prev = [980, diamondY + 45];
  right.forEach(([type, x, yy, text], i) => {
    b += line(prev[0], prev[1], 980, yy);
    if (type === 'event') b += event(x, yy, 180, 72, text, 17);
    else b += rect(x, yy, 150, 66, text, 'func', 18);
    if (i === 0) {
      b += rect(1165, yy + 6, 170, 54, 'Юрист / бухгалтер', 'role', 17);
      b += line(1055, yy + 33, 1165, yy + 33, 'linePlain');
    }
    if (i === 3) {
      b += rect(1165, yy + 6, 170, 54, 'Подрядчики', 'org', 15);
      b += line(1055, yy + 33, 1165, yy + 33, 'linePlain');
    }
    prev = [980, yy + (type === 'event' ? 72 : 66)];
  });
  b += `<rect class="legend" x="70" y="1680" width="630" height="70"/>
${event(95, 1696, 110, 34, 'Event', 10)}
${rect(260, 1696, 110, 34, 'Function', 'func', 10)}
${rect(425, 1696, 110, 34, 'Role', 'role', 10)}
${rect(585, 1696, 110, 34, 'Data', 'data', 10)}`;
  return svgShell(1600, 1800, 'EPC «Обработка заказа на мероприятие»', b);
}

const files = [
  ['01_org_model_event_agency.svg', orgChart()],
  ['02_process_landscape_event_agency.svg', processLandscape()],
  ['03_data_model_event_agency.svg', dataModel()],
  ['04_epc_event_order_process.svg', epcModel()],
];

for (const [name, content] of files) {
  fs.writeFileSync(path.join(outDir, name), content, 'utf8');
}

const readme = `# ARIS-модели event-агентства

Файлы подготовлены в стиле ARIS Express:

1. \`01_org_model_event_agency.svg\` - Organizational Chart
2. \`02_process_landscape_event_agency.svg\` - Process Landscape / VACD
3. \`03_data_model_event_agency.svg\` - Data Model
4. \`04_epc_event_order_process.svg\` - EPC

Настоящий формат \`.adf\` у ARIS Express является закрытым форматом приложения. Без самого ARIS Express корректно создать полноценный ADF-файл нельзя. Если нужен именно ADF:

1. Откройте ARIS Express.
2. Создайте соответствующую модель: Organizational Chart, Business Process, Data Model или EPC.
3. Перенесите объекты со схем SVG или вставьте SVG как изображение.
4. Сохраните модель через File -> Save as. ARIS Express создаст настоящий \`.adf\`.
`;

fs.writeFileSync(path.join(outDir, 'README.md'), readme, 'utf8');

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>ARIS-модели event-агентства</title>
  <style>
    body { margin: 0; font: 16px Arial, sans-serif; background: #f3f5f7; color: #1f2328; }
    header { padding: 28px 36px; background: #fff; border-bottom: 1px solid #d8dee4; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    main { padding: 24px 36px 48px; display: grid; gap: 28px; }
    section { background: #fff; border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 20px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #d0d7de; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>ARIS-модели event-агентства</h1>
    <div>Организационная модель, Process Landscape, Data Model и EPC.</div>
  </header>
  <main>
    ${files.map(([name], index) => `<section><h2>${index + 1}. ${name}</h2><img src="${name}" alt="${name}"></section>`).join('\n    ')}
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
console.log(`Created ${files.length} SVG diagrams in ${outDir}`);
