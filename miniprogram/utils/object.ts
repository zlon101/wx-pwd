export function createRegExp(searchText: string, isAllMatch = false): RegExp {
  let reg: RegExp = null as any;
  if (/^\//.test(searchText)) {
    // 正则模式
    const parseArr = /^\/(.+?)\/(\w*)$/.exec(searchText);
    if (!parseArr) {
      throw new Error(`无效的正则表达式: ${searchText}`);
    }
    let [regSource, regModifer] = [parseArr[1], parseArr[2]];
    // 全匹配
    if (isAllMatch) {
      regSource = `\b${regSource}\b`;
    }
    // regSource = regSource.replace(/\//g, '\\');
    reg = new RegExp(regSource, regModifer);
  } else {
    searchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isAllMatch) {
      searchText = `\\b${searchText}\\b`;
    }
    reg = new RegExp(searchText, 'mi');
  }
  return reg;
}

export function getType(val: any, expectType?: string): string | boolean {
  const reaType = Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
  if (expectType) {
    return expectType.toLowerCase() === reaType;
  }
  return reaType;
}
