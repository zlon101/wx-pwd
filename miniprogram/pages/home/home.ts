import { log } from '../../utils/log';
import {gitlabManaget, IPsItem} from './tool';

interface IPageData {
  isSearch: boolean;
  tabs: {label: string; value: string}[];
  curTab: string;
  tabContent: IPsItem[];
  inputVal: string;
}

function filterPs(list: IPsItem[], s: string) {
  if (!s) return list;
  const reg = new RegExp(s, 'i');
  return list.filter((item: IPsItem) => reg.test([item.t, item.d].join(' ')));
}

Page<IPageData, any>({
  data: {
    isSearch: false,
    inputVal: '',
    tabs: [],
    curTab: '',
    tabContent: [],
  },
  customData: {
    fileContentMap: new Map(),
  },
  onLoad() {
    // const e: any = {};
    // e.detail = {value: '1108 1109'};
    // this.onInputConfirm(e);
  },
  async onTabClick(e: any) {
    const _path = typeof e === 'string' ? e : e.currentTarget.dataset.path;
    const cache = this.customData.fileContentMap.get(_path);
    let psArray;
    if (cache) {
      psArray = cache;
    } else {
      psArray = await gitlabManaget.getPsOfTab(_path);
      this.customData.fileContentMap.set(_path, psArray);
    }
    
    const _tabContent = (()=>{
      const _input = this.data.inputVal;
      if (this.data.isSearch && _input) {
        return filterPs(psArray, _input);
      }
      return psArray;
    })()
    this.setData({
      tabContent: _tabContent,
      curTab: _path,
    });
  },
  onInputChange(e: any) {
    const val = e.detail.value;
    const newData: Partial<IPageData> = {
      inputVal: val,
    };
    if (this.data.isSearch) {
      newData.tabContent = filterPs(this.customData.fileContentMap.get(this.data.curTab), val);
    }
    this.setData(newData);
  },
  // 提交输入的密码
  onInputConfirm(e: any) {
    const [a, b] = e.detail.value.trim().split(/\s+/);
    gitlabManaget.setToken(a);
    gitlabManaget.setContentPs(b);
    gitlabManaget.getFiles().then(files => {
      const _tabs = files.map(item => ({label: item.name, value: item.path}));
      this.onTabClick(_tabs[0].value);
      this.setData({
        tabs: _tabs,
        curTab: _tabs[0].value,
        isSearch: true,
        inputVal: '',
      });
    });
  },
  onCopy(e: any) {
    const txt = e.currentTarget.dataset.ps;
    wx.setClipboardData({
      data: txt,
    })
  },
})