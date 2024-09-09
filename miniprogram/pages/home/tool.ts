import { encrypt, decrypt } from '../../utils/crypt';
import { downFile, IRepositoryFile, getRepositoryTree } from '../../utils/gitlab';
import { log } from '../../utils/log';

export interface IPsItem {
  t: string;
  z: string;
  v: string;
  d: string;
  url?: string;
}

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
      wx.showLoading({
        title: '加载中...',
      });
      try {
        const res = await downFile({ ...conf, path: filePath });
        return decrypt(res, conf.contentPs);
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
    }
  }
})();
