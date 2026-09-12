export const STR = {
  en: {
    think: 'Aurora is thinking…',
    wtm: 'White to move',
    btm: 'Black to move',
    check: 'in check',
    mateW: 'White wins by checkmate',
    mateB: 'Black wins by checkmate',
    hint: 'Hint',
  },
  fr: {
    think: 'Aurora réfléchit…',
    wtm: 'Trait aux Blancs',
    btm: 'Trait aux Noirs',
    check: 'échec',
    mateW: 'Les Blancs gagnent par échec et mat',
    mateB: 'Les Noirs gagnent par échec et mat',
    hint: 'Indice',
  },
};

export function t(lang, key) {
  return (STR[lang] || STR.en)[key] || STR.en[key] || key;
}
