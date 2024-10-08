import { encrypt, decrypt } from '../../utils/crypt';
import { downFile, IRepositoryFile, getRepositoryTree, updateFile } from '../../utils/gitlab';
import { log } from '../../utils/log';

// export interface IPsItem {
//   t: string;
//   z: string;
//   v: string;
//   d: string;
//   url?: string;
// }
export type IPsItem = string;

export const gitlabManaget = (function () {
  const conf = {
    id: 56200190,
    path: 'kvf',
    token: 'U2FsdGVkX1+shWjJbP1lsQ8wfR2YCePj6wp8AeQDyz4pJJYPI+wKkhFoKUMdAtwh',
    contentPs: '',
  };
  return {
    setToken(val: string) {
      conf.token = decrypt(conf.token, val, false);
    },
    setContentPs(val: string) {
      conf.contentPs = val;
    },
    async getFiles(): Promise<IRepositoryFile[]> {
      const files: IRepositoryFile[] = await getRepositoryTree({
        ...conf,
        path: undefined,
        recursive: false,
      });
      return files;
    },
    async getPsOfTab(filePath: string): Promise<IPsItem[]> {
      wx.showLoading({ title: '加载中...' });
      try {
        const res = await downFile({ ...conf, path: filePath });
        const content: string = decrypt(res, conf.contentPs, false);
        return content.trim().split(/\n{2,}/);
      } catch (e) {
        log('文件下载失败', e, 'error');
        wx.showToast({
          title: '文件下载失败',
          icon: 'error',
          duration: 2000
        });
        return [];
      } finally {
        wx.hideLoading();
      }
    },
    async updateContent(filePath: string, content: string, commitMsg: string) {
      wx.showLoading({ title: '加载中...' });
      // const commitMsg = `从 wx 更新 ${filePath}`;
      try {
        const encodedStr: string = encrypt(content, conf.contentPs);
        await updateFile(encodedStr, commitMsg, {...conf, path: filePath});
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 2000
        });
      } catch (e) {
        log('文件提交失败', e, 'error');
        wx.showToast({
          title: '文件提交失败',
          icon: 'error',
          duration: 2000
        });
        throw new Error('文件提交失败');
      } finally {
        wx.hideLoading();
      }
    },
  }
})();

export const randomString = (len: number, cfg = {onlyNumber: false, speical: true}) => {
  const Alphabet = 'ABCDEFGHJKLMNPQRSTVWXYZabcdefghijkmnpqrstuvwxyz';
  const Nums = '1234567890';
  const Speic = '!@#$%^&_?<>';
  let sets: string = cfg.onlyNumber ? Nums : (cfg.speical ? Alphabet.concat(Nums, Speic) : Alphabet.concat(Nums));
  sets = confused<string>(Array.from(sets)).join('');
  const strLen = sets.length;
  let randomStr = '';
  for (let i = 0; i < len; i++) {
    randomStr += sets.charAt(Math.floor(Math.random() * strLen));
  }
  return randomStr;
};
// 洗牌算法
function confused<T>(arr1: T[]): T[] {
  const N = (arr1 || []).length;
  if (N < 2) {
    return arr1;
  }
  const shuffle = (arr: T[]) => {
    let n = arr.length;
    let random = -1;
    while (0 !== n) {
      // 无符号右移位运算符向下取整，或者改写成 random = Math.floor(Math.random() * n--)
      random = (Math.random() * n--) >>> 0;
      [arr[n], arr[random]] = [arr[random], arr[n]];
    }
    return arr;
  };
  return shuffle([...arr1]);
}

interface IToast {
  icon?: 'success' | 'error' | 'none';
  duration?: number;
}
export function toast(msg: string | number, cfg: IToast = {}) {
  wx.showToast({
    title: `${msg}`,
    icon: 'success',
    duration: 2000,
    ...cfg,
  });
}