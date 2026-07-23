import { FONT, MUTED, BORDER } from './_helpers.js';

// The "when to use what" prose that used to live here is now the designer guide
// (scripts/build-guide.mjs), which generates it from tokens.json instead of restating it
// by hand — one place to change, and it cannot drift from the tokens. This story is the
// entry point to the guide from the Storybook sidebar.
export default { title: 'Tokens/Guide' };

const LINKS = [
  ['С чего начать', 'start', 'Четыре правила первого дня.'],
  ['Как читать имя токена', 'naming', 'Поверхность / назначение / вариант.'],
  ['Правило пары', 'pairs', 'Каждому фону — свой On-* для текста и иконки.'],
  ['Свои токены для поверхности', 'own', 'Своя коллекция или капсула — дерево решений.'],
  ['Старые имена', 'legacy', 'Во что превратился цвет из лендинговой системы.'],
  ['Поиск по всем токенам', 'browser', 'Имя, CSS-переменная, значение, описание.'],
];

export const ForDesigners = () => {
  const el = document.createElement('div');
  el.style.cssText = `padding:32px;font-family:${FONT};max-width:820px;line-height:1.55`;
  el.innerHTML = `
    <h2 style="margin:0 0 8px">Гайд для дизайнеров</h2>
    <p style="color:${MUTED};margin:0 0 22px;font-size:14px">
      Как пользоваться токенами в Figma: что где лежит, как выбрать токен, чего делать нельзя
      и что делать, если нужного токена нет. Собирается из тех же токенов, что и этот Storybook,
      поэтому не расходится с системой.
    </p>
    <a href="./guide/" target="_blank" rel="noopener"
       style="display:inline-block;background:#6d46fc;color:#fff;text-decoration:none;
              padding:11px 20px;border-radius:9px;font-weight:600;font-size:15px">Открыть гайд →</a>
    <p style="color:${MUTED};margin:14px 0 26px;font-size:13px">
      Ссылка ведёт на опубликованный гайд рядом со Storybook. Локально (<code>npm run storybook</code>)
      он не собран — запусти <code>npm run build:guide</code> и открой <code>guide-dist/index.html</code>.
    </p>
    <div style="border-top:1px solid ${BORDER};padding-top:18px">
      ${LINKS.map(
        ([title, hash, desc]) => `
        <div style="display:flex;gap:18px;padding:8px 0;align-items:baseline">
          <a href="./guide/#${hash}" target="_blank" rel="noopener"
             style="flex:0 0 250px;color:#6d46fc;text-decoration:none;font-weight:700;font-size:13px">${title}</a>
          <div style="font-size:14px">${desc}</div>
        </div>`
      ).join('')}
    </div>`;
  return el;
};
