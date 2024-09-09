import { getType } from './object';
import CryptoJS from './crypto-js/index';
import {log} from './log';

const modeConf = {
  mode: CryptoJS.mode.CTR,
  padding: CryptoJS.pad.Iso10126,
};
export function encrypt(val: any, ps: string): string {
  let str = '';
  if ([undefined, null, ''].includes(val)) {
    str = '';
  } else if (getType(val, 'string')) {
    str = val;
  } else {
    try {
      str = JSON.stringify(val);
    } catch (e) {
      log('encrypt 失败', e, 'error');
      throw new Error('encrypt 失败! val 无法序列号');
    }
  }
  return CryptoJS.AES.encrypt(str, ps, modeConf).toString();
}

export function decrypt(encoded: string, ps: string, json = true) {
  let val: any;
  try {
    const bytes  = CryptoJS.AES.decrypt(encoded, ps, modeConf);
    val = bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    log('decrypt 失败', e, 'error');
    throw new Error('decrypt 失败');
  }
  if (!json) {
    return val;
  }
  try {
    return JSON.parse(val);
  } catch (_) {
  }
  return val;
}
